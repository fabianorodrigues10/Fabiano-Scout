import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { generateReport, generateExcel } from "@/lib/report";

const FAIXAS_IDADE = [
  { label: "Todas", min: 0, max: 99 },
  { label: "Sub-21", min: 1, max: 21 },
  { label: "21-25", min: 21, max: 25 },
  { label: "26-30", min: 26, max: 30 },
  { label: "31+", min: 31, max: 99 },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [selectedPosicao, setSelectedPosicao] = useState<string | null>(null);
  const [selectedClube, setSelectedClube] = useState<string | null>(null);
  const [selectedIdadeFaixa, setSelectedIdadeFaixa] = useState(0);

  const { data: atletas = [], isLoading, refetch } = trpc.atletas.list.useQuery();

  // Extrair posições e clubes únicos
  const posicoes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a) => { if (a.posicao) set.add(a.posicao); });
    return Array.from(set).sort();
  }, [atletas]);

  const clubes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a) => { if (a.clube) set.add(a.clube); });
    return Array.from(set).sort();
  }, [atletas]);

  // Filtragem
  const filteredAtletas = useMemo(() => {
    const faixa = FAIXAS_IDADE[selectedIdadeFaixa];
    return atletas.filter((atleta) => {
      if (searchQuery && !atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedPosicao && atleta.posicao !== selectedPosicao) {
        return false;
      }
      if (selectedClube && atleta.clube !== selectedClube) {
        return false;
      }
      if (faixa && faixa.min > 0) {
        const idade = atleta.idade ?? 0;
        if (idade < faixa.min || idade > faixa.max) {
          return false;
        }
      }
      return true;
    });
  }, [atletas, searchQuery, selectedPosicao, selectedClube, selectedIdadeFaixa]);

  const activeFilterCount = (selectedPosicao ? 1 : 0) + (selectedClube ? 1 : 0) + (selectedIdadeFaixa > 0 ? 1 : 0);

  const clearFilters = () => {
    setSelectedPosicao(null);
    setSelectedClube(null);
    setSelectedIdadeFaixa(0);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<"nome" | "idade" | "altura">("nome");

  const handleAddAtleta = () => {
    router.push("/atleta/novo" as any);
  };

  const handleReportPress = () => {
    if (filteredAtletas.length === 0) {
      Alert.alert("Sem atletas", "Nenhum atleta encontrado com os filtros atuais.");
      return;
    }
    setShowReportConfirm(true);
  };

  const handleConfirmReport = async () => {
    setShowReportConfirm(false);
    setGeneratingPdf(true);
    try {
      const ids = filteredAtletas.map((a) => a.id);
      const filters = {
        posicao: selectedPosicao || "Todas",
        faixaIdade: selectedIdadeFaixa > 0 ? FAIXAS_IDADE[selectedIdadeFaixa].label : "Todas",
        clube: selectedClube || "Todos",
        busca: searchQuery || undefined,
      };
      await generateReport(ids, filters);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível gerar o relatório.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleAtletaPress = (id: number) => {
    router.push(`/atleta/detalhes/${id}` as any);
  };

  const handleExcelPress = () => {
    if (filteredAtletas.length === 0) {
      Alert.alert("Sem atletas", "Nenhum atleta encontrado com os filtros atuais.");
      return;
    }
    handleConfirmExcel();
  };

  const handleConfirmExcel = async () => {
    setGeneratingExcel(true);
    try {
      const ids = filteredAtletas.map((a) => a.id);
      const filters = {
        posicao: selectedPosicao || "Todas",
        faixaIdade: selectedIdadeFaixa > 0 ? FAIXAS_IDADE[selectedIdadeFaixa].label : "Todas",
        clube: selectedClube || "Todos",
        busca: searchQuery || undefined,
      };
      await generateExcel(ids, filters);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível gerar a planilha.");
    } finally {
      setGeneratingExcel(false);
    }
  };

  const sortedAtletas = useMemo(() => {
    const sorted = [...filteredAtletas];
    if (sortBy === "nome") {
      sorted.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (sortBy === "idade") {
      sorted.sort((a, b) => Number(b.idade ?? 0) - Number(a.idade ?? 0));
    } else if (sortBy === "altura") {
      sorted.sort((a, b) => Number(b.altura ?? 0) - Number(a.altura ?? 0));
    }
    return sorted;
  }, [filteredAtletas, sortBy]);

  return (
    <ScreenContainer className="bg-background">
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <Image
              source={require("@/assets/images/fabiano-scout-logo.png")}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
            <View>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>Fabiano Scout</Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Análise de Atletas</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings")}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" }}
          >
            <IconSymbol name="gearshape.fill" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Barra de Busca */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
            <TextInput
              placeholder="Buscar atleta..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, marginLeft: 8, color: colors.foreground, fontSize: 14 }}
              returnKeyType="done"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: activeFilterCount > 0 ? colors.error : colors.surface,
              borderWidth: activeFilterCount > 0 ? 0 : 1,
              borderColor: colors.border,
              borderRadius: 20,
              width: 44,
              height: 44,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconSymbol
              name="slider.horizontal.3"
              size={20}
              color={activeFilterCount > 0 ? "white" : colors.muted}
            />
            {activeFilterCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.error,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Contador */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
            {filteredAtletas.length} atleta{filteredAtletas.length !== 1 ? "s" : ""} encontrado{filteredAtletas.length !== 1 ? "s" : ""}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={{ fontSize: 12, color: "white", fontWeight: "600" }}>Limpar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Painel de Filtros */}
      {showFilters && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          {/* Posição */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 8 }}>
            Posição
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setSelectedPosicao(null)}
                style={{
                  backgroundColor: !selectedPosicao ? colors.primary : colors.surface,
                  borderWidth: !selectedPosicao ? 0 : 1,
                  borderColor: colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                }}
              >
                <Text style={{ color: !selectedPosicao ? "white" : colors.foreground, fontSize: 12, fontWeight: "600" }}>Todas</Text>
              </TouchableOpacity>
              {posicoes.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => setSelectedPosicao(selectedPosicao === pos ? null : pos)}
                  style={{
                    backgroundColor: selectedPosicao === pos ? colors.primary : colors.surface,
                    borderWidth: selectedPosicao === pos ? 0 : 1,
                    borderColor: colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{ color: selectedPosicao === pos ? "white" : colors.foreground, fontSize: 12, fontWeight: "600" }}>
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Idade */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Faixa de Idade
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {FAIXAS_IDADE.map((faixa, idx) => (
                <TouchableOpacity
                  key={faixa.label}
                  onPress={() => setSelectedIdadeFaixa(idx)}
                  style={{
                    backgroundColor: selectedIdadeFaixa === idx ? colors.primary : colors.surface,
                    borderWidth: selectedIdadeFaixa === idx ? 0 : 1,
                    borderColor: colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{ color: selectedIdadeFaixa === idx ? "white" : colors.foreground, fontSize: 12, fontWeight: "600" }}>
                    {faixa.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Clube */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Clube
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setSelectedClube(null)}
                style={{
                  backgroundColor: !selectedClube ? colors.primary : colors.surface,
                  borderWidth: !selectedClube ? 0 : 1,
                  borderColor: colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                }}
              >
                <Text style={{ color: !selectedClube ? "white" : colors.foreground, fontSize: 12, fontWeight: "600" }}>
                  Todos
                </Text>
              </TouchableOpacity>
              {clubes.map((clube) => (
                <TouchableOpacity
                  key={clube}
                  onPress={() => setSelectedClube(selectedClube === clube ? null : clube)}
                  style={{
                    backgroundColor: selectedClube === clube ? colors.primary : colors.surface,
                    borderWidth: selectedClube === clube ? 0 : 1,
                    borderColor: colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{ color: selectedClube === clube ? "white" : colors.foreground, fontSize: 12, fontWeight: "600", maxWidth: 100 }} numberOfLines={1}>
                    {clube}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Seção de Ordenação */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
          <TouchableOpacity
            onPress={() => setSortBy("nome")}
            style={{
              backgroundColor: sortBy === "nome" ? colors.primary : colors.surface,
              borderWidth: sortBy === "nome" ? 0 : 1,
              borderColor: colors.border,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: sortBy === "nome" ? "white" : colors.foreground, fontSize: 11, fontWeight: "600" }}>Nome</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy("idade")}
            style={{
              backgroundColor: sortBy === "idade" ? colors.primary : colors.surface,
              borderWidth: sortBy === "idade" ? 0 : 1,
              borderColor: colors.border,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: sortBy === "idade" ? "white" : colors.foreground, fontSize: 11, fontWeight: "600" }}>Idade</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy("altura")}
            style={{
              backgroundColor: sortBy === "altura" ? colors.primary : colors.surface,
              borderWidth: sortBy === "altura" ? 0 : 1,
              borderColor: colors.border,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: sortBy === "altura" ? "white" : colors.foreground, fontSize: 11, fontWeight: "600" }}>Altura</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleExcelPress} disabled={generatingExcel} style={{ marginLeft: 8 }}>
          <IconSymbol name="square.and.arrow.down" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Lista de Atletas */}
      <FlatList
        data={sortedAtletas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            onPress={() => handleAtletaPress(item.id)}
            style={{
              marginHorizontal: 16,
              marginVertical: 6,
              backgroundColor: colors.surface,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {item.fotoUrl ? (
              <Image
                source={{ uri: item.fotoUrl }}
                style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                  {item.nome?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
                {item.nome || "Sem nome"}
              </Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {item.posicao && (
                  <View style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, color: "white", fontWeight: "600" }}>
                      {item.posicao}
                    </Text>
                  </View>
                )}
                {item.clube && (
                  <Text style={{ fontSize: 10, color: colors.muted }}>
                    {item.clube}
                  </Text>
                )}
                {item.idade && (
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "600" }}>
                    {item.idade} anos
                  </Text>
                )}
              </View>
            </View>

            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      {/* Modal de Confirmação de Relatório */}
      <Modal visible={showReportConfirm} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 20, width: "80%", maxWidth: 300 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>
              Gerar Relatório?
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
              Será gerado um PDF com os {filteredAtletas.length} atleta(s) filtrado(s).
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowReportConfirm(false)}
                style={{ flex: 1, paddingVertical: 10, backgroundColor: colors.border, borderRadius: 8, justifyContent: "center", alignItems: "center" }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReport}
                disabled={generatingPdf}
                style={{ flex: 1, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 8, justifyContent: "center", alignItems: "center" }}
              >
                {generatingPdf ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "600" }}>Gerar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
