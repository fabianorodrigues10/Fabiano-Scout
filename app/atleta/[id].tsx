import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { OgolWebScraper, type OgolPlayerData } from "@/components/ogol-web-scraper";
import { getApiBaseUrl } from "@/constants/oauth";

const POSICOES = [
  "Goleiro",
  "Lateral",
  "Zagueiro",
  "Volante",
  "Meia",
  "Extremo",
  "Centroavante",
  "2º Atacante",
];

const PES = ["direito", "esquerdo", "ambidestro"];

export default function AtletaFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  
  const isEdit = Boolean(id && id !== "novo");
  
  // Estados do formulário
  const [nome, setNome] = useState("");
  const [posicao, setPosicao] = useState("");
  const [segundaPosicao, setSegundaPosicao] = useState("");
  const [clube, setClube] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [idade, setIdade] = useState("");
  const [altura, setAltura] = useState("");
  const [pe, setPe] = useState("");
  const [link, setLink] = useState("");
  const [escala, setEscala] = useState("");
  const [valencia, setValencia] = useState("");
  const [ogolLoading, setOgolLoading] = useState(false);

  // Estado para WebView scraper
  const [ogolScrapeUrl, setOgolScrapeUrl] = useState<string | null>(null);
  
  // Query para buscar atleta (se editando)
  const { data: atleta, isLoading: loadingAtleta } = trpc.atletas.getById.useQuery(
    { id: Number(id) },
    { enabled: Boolean(isAuthenticated && isEdit) }
  );
  
  // Mutations
  const createMutation = trpc.atletas.create.useMutation();
  const updateMutation = trpc.atletas.update.useMutation();
  const deleteMutation = trpc.atletas.delete.useMutation();
  
  // Carrega dados do atleta ao editar
  useEffect(() => {
    if (atleta) {
      setNome(atleta.nome);
      setPosicao(atleta.posicao || "");
      setSegundaPosicao(atleta.segundaPosicao || "");
      setClube(atleta.clube || "");
      if (atleta.dataNascimento) {
        const d = new Date(atleta.dataNascimento);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        setDataNascimento(`${dd}/${mm}/${yy}`);
      } else {
        setDataNascimento("");
      }
      setIdade(atleta.idade?.toString() || "");
      setAltura(atleta.altura || "");
      setPe(atleta.pe || "");
      setLink(atleta.link || "");
      setEscala(atleta.escala || "");
      setValencia(atleta.valencia || "");
    }
  }, [atleta]);
  
  // Calcula idade automaticamente a partir do formato dd/mm/aa
  useEffect(() => {
    if (dataNascimento && dataNascimento.length === 8) {
      try {
        const parts = dataNascimento.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            year = year > 50 ? 1900 + year : 2000 + year;
            const nascimento = new Date(year, month - 1, day);
            const hoje = new Date();
            let idadeCalculada = hoje.getFullYear() - nascimento.getFullYear();
            const mes = hoje.getMonth() - nascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
              idadeCalculada--;
            }
            if (idadeCalculada >= 0 && idadeCalculada <= 60) {
              setIdade(idadeCalculada.toString());
            }
          }
        }
      } catch (e) {
        // Data inválida
      }
    }
  }, [dataNascimento]);

  // Aplica dados extraídos do Ogol ao formulário
  const applyOgolData = useCallback((data: OgolPlayerData) => {
    setOgolLoading(false);
    setOgolScrapeUrl(null);
    
    let preenchidos = 0;

    if (data.nome && !nome.trim()) {
      setNome(data.nome);
      preenchidos++;
    }
    if (data.posicao && !posicao.trim()) {
      setPosicao(data.posicao);
      preenchidos++;
    }
    if (data.dataNascimento && !dataNascimento.trim()) {
      setDataNascimento(data.dataNascimento);
      preenchidos++;
    }
    if (data.idade != null && !idade.trim()) {
      setIdade(data.idade.toString());
      preenchidos++;
    }
    if (data.altura != null && !altura.trim()) {
      setAltura(data.altura.toString());
      preenchidos++;
    }
    if (data.pe && !pe.trim()) {
      setPe(data.pe);
      preenchidos++;
    }
    if (data.clube && !clube.trim()) {
      setClube(data.clube);
      preenchidos++;
    }

    if (preenchidos > 0) {
      Alert.alert(
        "Dados Importados",
        `${preenchidos} campo(s) preenchido(s) automaticamente a partir do Ogol.\n\nRevise os dados e ajuste o que for necessário.`
      );
    } else {
      Alert.alert(
        "Nenhum campo novo",
        "Todos os campos já estavam preenchidos. Os dados do Ogol não sobrescrevem campos existentes."
      );
    }
  }, [nome, posicao, dataNascimento, idade, altura, pe, clube]);

  const handleOgolError = useCallback((error: string) => {
    setOgolLoading(false);
    setOgolScrapeUrl(null);
    Alert.alert("Erro ao importar", error);
  }, []);

  // Preencher dados do Ogol - usa WebView no nativo, fetch na web
  const handlePreencherOgol = async () => {
    if (!link.trim()) {
      Alert.alert("Atenção", "Cole o link do Ogol no campo Link antes de preencher.");
      return;
    }
    if (!link.includes("ogol.com")) {
      Alert.alert("Atenção", "O link deve ser do site ogol.com.br");
      return;
    }

    setOgolLoading(true);

    if (Platform.OS === "web") {
      // Na web, tenta fetch direto (pode funcionar dependendo do CORS)
      try {
        const response = await fetch(link.trim(), {
          headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        if (response.ok) {
          const html = await response.text();
          // Importa o parser do lib/ogol.ts
          const { parseOgolHtml } = await import("@/lib/ogol");
          const data = parseOgolHtml(html);
          if (data.nome || data.posicao || data.dataNascimento) {
            applyOgolData(data);
            return;
          }
        }
      } catch (e) {
        console.log("[Ogol] Web fetch failed", e);
      }

      // Fallback: tenta via servidor
      try {
        const apiBaseUrl = getApiBaseUrl();
        const serverUrl = `${apiBaseUrl}/api/ogol/scrape`;
        console.log("[Ogol] Trying server URL:", serverUrl);
        const response = await fetch(serverUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: link.trim() }),
        });
        console.log("[Ogol] Server response status:", response.status);
        if (response.ok) {
          const jsonResult = await response.json();
          console.log("[Ogol] Server response data:", jsonResult);
          if (jsonResult.success && jsonResult.data) {
            applyOgolData(jsonResult.data);
            return;
          }
        } else {
          console.log("[Ogol] Server returned error:", response.statusText);
        }
      } catch (e) {
        console.log("[Ogol] Server fetch also failed", e);
      }

      setOgolLoading(false);
      Alert.alert(
        "Não disponível na web",
        "A importação automática do Ogol funciona melhor no celular (via Expo Go). Na web, o site do Ogol bloqueia a conexão.\n\nPreencha os dados manualmente ou teste no celular."
      );
    } else {
      // No celular, usa WebView oculta
      setOgolScrapeUrl(link.trim());
    }
  };
  
  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome do atleta é obrigatório");
      return;
    }
    
    try {
      let dataNascimentoISO: string | undefined = undefined;
      if (dataNascimento && dataNascimento.length === 8) {
        const parts = dataNascimento.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            year = year > 50 ? 1900 + year : 2000 + year;
            dataNascimentoISO = new Date(year, month - 1, day).toISOString();
          }
        }
      }

      const data = {
        nome: nome.trim(),
        posicao: posicao || undefined,
        segundaPosicao: segundaPosicao || undefined,
        clube: clube || undefined,
        dataNascimento: dataNascimentoISO,
        idade: idade ? Number(idade) : undefined,
        altura: altura ? Number(altura) : undefined,
        pe: pe as any || undefined,
        link: link || undefined,
        escala: escala || undefined,
        valencia: valencia || undefined,
      };
      
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: Number(id),
          ...data,
        });
        Alert.alert("Sucesso", "Atleta atualizado com sucesso");
      } else {
        await createMutation.mutateAsync(data);
        Alert.alert("Sucesso", "Atleta cadastrado com sucesso");
      }
      
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar atleta");
    }
  };
  
  const handleExcluir = () => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este atleta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id: Number(id) });
              Alert.alert("Sucesso", "Atleta excluído com sucesso");
              router.back();
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Erro ao excluir atleta");
            }
          },
        },
      ]
    );
  };

  // Máscara para data dd/mm/aa
  const handleDataChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = "";
    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length <= 4) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    } else {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4) + "/" + cleaned.slice(4, 6);
    }
    setDataNascimento(formatted);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    backButton: {
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.foreground,
    },
    scrollContent: {
      padding: 16,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.foreground,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ogolButton: {
      marginTop: 8,
      borderRadius: 8,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FF6B00",
    },
    ogolButtonText: {
      color: "white",
      fontWeight: "600",
      marginLeft: 8,
    },
    ogolButtonHint: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
      textAlign: "center",
    },
    separator: {
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    separatorText: {
      fontSize: 12,
      color: colors.muted,
      marginHorizontal: 12,
    },
    positionRow: {
      flexDirection: "row",
      gap: 8,
    },
    positionButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    positionButtonText: {
      fontSize: 13,
      fontWeight: "600",
    },
    rowContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    rowItem: {
      flex: 1,
    },
    rowItemSmall: {
      width: 96,
    },
    peRow: {
      flexDirection: "row",
      gap: 8,
    },
    peButton: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: "center",
    },
    peButtonText: {
      fontSize: 11,
      fontWeight: "600",
    },
    valenciaInput: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    charCount: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "right",
      marginTop: 4,
    },
    saveButton: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 16,
    },
    saveButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
    },
    spacer: {
      height: 32,
    },
  });
  
  if (loadingAtleta) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }
  
  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const showOgolButton = link.includes("ogol.com");
  
  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* WebView oculta para scraping do Ogol */}
        <OgolWebScraper
          url={ogolScrapeUrl}
          onResult={applyOgolData}
          onError={handleOgolError}
          onLoadStart={() => setOgolLoading(true)}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.right" size={24} color={colors.foreground} style={{ transform: [{ rotate: "180deg" }] }} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEdit ? "Editar Atleta" : "Novo Atleta"}
            </Text>
          </View>
          
          {isEdit && (
            <TouchableOpacity onPress={handleExcluir} disabled={isLoading}>
              <IconSymbol name="trash" size={22} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Formulário */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

          {/* Link do Ogol - Movido para o topo para facilitar o fluxo */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Link do Ogol</Text>
            <TextInput
              style={styles.input}
              placeholder="Cole o link do ogol.com.br do atleta"
              placeholderTextColor={colors.muted}
              value={link}
              onChangeText={setLink}
              keyboardType="url"
              autoCapitalize="none"
            />
            
            {/* Botão Preencher do Ogol - aparece quando link contém ogol.com */}
            {showOgolButton && (
              <>
                <TouchableOpacity
                  onPress={handlePreencherOgol}
                  disabled={ogolLoading}
                  style={[styles.ogolButton, { opacity: ogolLoading ? 0.6 : 1 }]}
                >
                  {ogolLoading ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={styles.ogolButtonText}>Buscando dados...</Text>
                    </>
                  ) : (
                    <>
                      <IconSymbol name="bolt.fill" size={18} color="white" />
                      <Text style={styles.ogolButtonText}>Preencher do Ogol</Text>
                    </>
                  )}
                </TouchableOpacity>

                {Platform.OS !== "web" && (
                  <Text style={styles.ogolButtonHint}>
                    Abre a página do Ogol em segundo plano e extrai os dados automaticamente
                  </Text>
                )}
              </>
            )}

            {showOgolButton && (
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>Dados do Atleta</Text>
                <View style={styles.separatorLine} />
              </View>
            )}
          </View>

          {/* Nome */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome do Atleta *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Neymar Jr"
              placeholderTextColor={colors.muted}
              value={nome}
              onChangeText={setNome}
            />
          </View>
          
          {/* Posição */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Posição Principal</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.positionRow}>
                {POSICOES.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    onPress={() => setPosicao(posicao === pos ? "" : pos)}
                    style={[
                      styles.positionButton,
                      {
                        backgroundColor: posicao === pos ? colors.primary : colors.surface,
                        borderColor: posicao === pos ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.positionButtonText,
                        {
                          color: posicao === pos ? "white" : colors.foreground,
                        }
                      ]}
                    >
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Segunda Posição */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Segunda Posição (opcional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.positionRow}>
                {POSICOES.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    onPress={() => setSegundaPosicao(segundaPosicao === pos ? "" : pos)}
                    style={[
                      styles.positionButton,
                      {
                        backgroundColor: segundaPosicao === pos ? colors.primary : colors.surface,
                        borderColor: segundaPosicao === pos ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.positionButtonText,
                        {
                          color: segundaPosicao === pos ? "white" : colors.foreground,
                        }
                      ]}
                    >
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Clube */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Clube Atual</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Flamengo/RJ"
              placeholderTextColor={colors.muted}
              value={clube}
              onChangeText={setClube}
            />
          </View>
          
          {/* Data de Nascimento e Idade */}
          <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Data Nasc. (dd/mm/aa)</Text>
              <TextInput
                style={styles.input}
                placeholder="01/03/97"
                placeholderTextColor={colors.muted}
                value={dataNascimento}
                onChangeText={handleDataChange}
                keyboardType="numeric"
                maxLength={8}
              />
            </View>
            <View style={styles.rowItemSmall}>
              <Text style={styles.label}>Idade</Text>
              <TextInput
                style={styles.input}
                placeholder="Auto"
                placeholderTextColor={colors.muted}
                value={idade}
                onChangeText={setIdade}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          {/* Altura e Pé */}
          <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Altura</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 1.76"
                placeholderTextColor={colors.muted}
                value={altura}
                onChangeText={setAltura}
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Pé Preferencial</Text>
              <View style={styles.peRow}>
                {PES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPe(pe === p ? "" : p)}
                    style={[
                      styles.peButton,
                      {
                        backgroundColor: pe === p ? colors.primary : colors.surface,
                        borderColor: pe === p ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.peButtonText,
                        {
                          color: pe === p ? "white" : colors.foreground,
                        }
                      ]}
                      numberOfLines={1}
                    >
                      {p === "direito" ? "Dir" : p === "esquerdo" ? "Esq" : "Amb"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          {/* Escala */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Escala</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: A, B, C..."
              placeholderTextColor={colors.muted}
              value={escala}
              onChangeText={setEscala}
            />
          </View>

          {/* Valências */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Valências</Text>
            <TextInput
              style={[styles.input, styles.valenciaInput]}
              placeholder="Descreva as características e valências do atleta (até 500 caracteres)..."
              placeholderTextColor={colors.muted}
              value={valencia}
              onChangeText={(text) => setValencia(text.slice(0, 500))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {valencia.length}/500
            </Text>
          </View>
          
          {/* Botão Salvar */}
          <TouchableOpacity
            onPress={handleSalvar}
            disabled={isLoading}
            style={[styles.saveButton, { backgroundColor: isLoading ? colors.muted : colors.primary }]}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEdit ? "Salvar Alterações" : "Cadastrar Atleta"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Espaço extra no final */}
          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
