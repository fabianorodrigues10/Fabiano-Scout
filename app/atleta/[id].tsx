import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { OgolWebScraper, type OgolPlayerData } from "@/components/ogol-web-scraper";

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

const PES = ["Destro", "Canhoto", "Ambidestro"];

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
          const year = parseInt(parts[2]);
          
          // Assumir século 1900 se ano >= 50, senão 2000
          const fullYear = year >= 50 ? 1900 + year : 2000 + year;
          
          const birthDate = new Date(fullYear, month - 1, day);
          const today = new Date();
          let calculatedAge = today.getFullYear() - birthDate.getFullYear();
          
          if (
            today.getMonth() < birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
          ) {
            calculatedAge--;
          }
          
          if (calculatedAge > 0 && calculatedAge < 100) {
            setIdade(String(calculatedAge));
          }
        }
      } catch (e) {
        console.log("Erro ao calcular idade", e);
      }
    }
  }, [dataNascimento]);

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
    if (data.idade && !idade.trim()) {
      setIdade(String(data.idade));
      preenchidos++;
    }
    if (data.altura && !altura.trim()) {
      setAltura(String(data.altura));
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

  // Preencher dados do Ogol - usa WebView no nativo, proxy na web
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
      // Na web, usar endpoint proxy que contorna Cloudflare
      try {
        const { fetchOgolData } = await import("@/lib/ogol");
        const data = await fetchOgolData(link.trim());
        if (data && (data.nome || data.posicao || data.dataNascimento)) {
          applyOgolData(data);
          return;
        } else {
          throw new Error("Nenhum dado encontrado no Ogol");
        }
      } catch (e: any) {
        console.log("[Ogol] Proxy fetch failed", e);
        handleOgolError(e.message || "Erro ao buscar dados do Ogol");
      }
    } else {
      // No celular, usar WebView
      setOgolScrapeUrl(link.trim());
    }
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Nome é obrigatório");
      return;
    }

    try {
      const altura_num = altura ? parseFloat(altura) : null;

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: Number(id),
          nome,
          posicao: posicao || undefined,
          segundaPosicao: segundaPosicao || undefined,
          clube: clube || undefined,
          dataNascimento: dataNascimento ? convertDDMMYYToISO(dataNascimento) : undefined,
          idade: idade ? parseInt(idade) : undefined,
          altura: altura_num || undefined,
          pe: pe ? (pe.toLowerCase() as "direito" | "esquerdo" | "ambidestro") : undefined,
          link: link || undefined,
          escala: escala || undefined,
          valencia: valencia || undefined,
        });
        Alert.alert("Sucesso", "Atleta atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({
          nome,
          posicao: posicao || undefined,
          segundaPosicao: segundaPosicao || undefined,
          clube: clube || undefined,
          dataNascimento: dataNascimento ? convertDDMMYYToISO(dataNascimento) : undefined,
          idade: idade ? parseInt(idade) : undefined,
          altura: altura_num || undefined,
          pe: pe ? (pe.toLowerCase() as "direito" | "esquerdo" | "ambidestro") : undefined,
          link: link || undefined,
          escala: escala || undefined,
          valencia: valencia || undefined,
        });
        Alert.alert("Sucesso", "Atleta criado com sucesso!");
      }
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar atleta");
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir este atleta?",
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id: Number(id) });
              Alert.alert("Sucesso", "Atleta excluído com sucesso!");
              router.back();
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Erro ao excluir atleta");
            }
          },
        },
      ]
    );
  };

  if (loadingAtleta) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <>
      {ogolScrapeUrl && (
        <OgolWebScraper
          url={ogolScrapeUrl}
          onResult={applyOgolData}
          onError={handleOgolError}
          onLoadStart={() => {}}
        />
      )}

      <ScreenContainer className="pb-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <Text className="text-2xl font-bold text-foreground mb-6">
            {isEdit ? "Editar Atleta" : "Novo Atleta"}
          </Text>

          {/* Nome */}
          <Text className="text-sm font-semibold text-foreground mb-2">Nome *</Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground mb-4"
            placeholder="Nome completo"
            value={nome}
            onChangeText={setNome}
            placeholderTextColor={colors.muted}
          />

          {/* Link do Ogol */}
          <Text className="text-sm font-semibold text-foreground mb-2">Link Ogol</Text>
          <View className="flex-row gap-2 mb-4">
            <TextInput
              className="flex-1 border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="https://www.ogol.com.br/jogador/..."
              value={link}
              onChangeText={setLink}
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity
              onPress={handlePreencherOgol}
              disabled={ogolLoading || !link.trim()}
              className={`px-4 py-3 rounded-lg ${
                ogolLoading || !link.trim()
                  ? "bg-muted"
                  : "bg-primary"
              }`}
            >
              {ogolLoading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <IconSymbol name="paperplane.fill" size={20} color={colors.background} />
              )}
            </TouchableOpacity>
          </View>

          {/* Posição */}
          <Text className="text-sm font-semibold text-foreground mb-2">Posição</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {POSICOES.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => setPosicao(posicao === pos ? "" : pos)}
                  className={`px-4 py-2 rounded-full ${
                    posicao === pos
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      posicao === pos ? "text-background" : "text-foreground"
                    }`}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Data de Nascimento */}
          <Text className="text-sm font-semibold text-foreground mb-2">Data de Nascimento (dd/mm/aa)</Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground mb-4"
            placeholder="DD/MM/AA"
            value={dataNascimento}
            onChangeText={setDataNascimento}
            maxLength={8}
            placeholderTextColor={colors.muted}
          />

          {/* Idade */}
          <Text className="text-sm font-semibold text-foreground mb-2">Idade</Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground mb-4"
            placeholder="Calculada automaticamente"
            value={idade}
            onChangeText={setIdade}
            keyboardType="numeric"
            placeholderTextColor={colors.muted}
          />

          {/* Altura */}
          <Text className="text-sm font-semibold text-foreground mb-2">Altura (m)</Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground mb-4"
            placeholder="Ex: 1.76"
            value={altura}
            onChangeText={setAltura}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.muted}
          />

          {/* Pé */}
          <Text className="text-sm font-semibold text-foreground mb-2">Pé Preferencial</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {PES.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPe(pe === p ? "" : p)}
                  className={`px-4 py-2 rounded-full ${
                    pe === p
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      pe === p ? "text-background" : "text-foreground"
                    }`}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Clube */}
          <Text className="text-sm font-semibold text-foreground mb-2">Clube</Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground mb-4"
            placeholder="Nome do clube"
            value={clube}
            onChangeText={setClube}
            placeholderTextColor={colors.muted}
          />

          {/* Segunda Posição */}
          <Text className="text-sm font-semibold text-foreground mb-2">Segunda Posição</Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground mb-4"
            placeholder="Posição alternativa"
            value={segundaPosicao}
            onChangeText={setSegundaPosicao}
            placeholderTextColor={colors.muted}
          />

          {/* Escala */}
          <Text className="text-sm font-semibold text-foreground mb-2">Escala</Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground mb-4"
            placeholder="Ex: 8.5"
            value={escala}
            onChangeText={setEscala}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.muted}
          />

          {/* Valências */}
          <Text className="text-sm font-semibold text-foreground mb-2">Valências</Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground mb-4 h-24"
            placeholder="Descrição das características do atleta (até 500 caracteres)"
            value={valencia}
            onChangeText={(text) => setValencia(text.slice(0, 500))}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.muted}
            textAlignVertical="top"
          />
          <Text className="text-xs text-muted mb-4">{valencia.length}/500</Text>

          {/* Botões */}
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-primary rounded-lg py-3"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text className="text-center font-semibold text-background">
                  {isEdit ? "Atualizar" : "Criar"}
                </Text>
              )}
            </TouchableOpacity>

            {isEdit && (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-error rounded-lg py-3"
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text className="text-center font-semibold text-background">Excluir</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    </>
  );
}

function convertDDMMYYToISO(ddmmyy: string): string {
  const parts = ddmmyy.split("/");
  if (parts.length !== 3) return "";
  
  const day = parts[0];
  const month = parts[1];
  let year = parts[2];
  
  // Converter YY para YYYY
  const yy = parseInt(year);
  const fullYear = yy >= 50 ? 1900 + yy : 2000 + yy;
  
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
