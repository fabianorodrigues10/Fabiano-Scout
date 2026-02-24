import { useState, useMemo } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { generateReport, generateExcel } from "@/lib/report";
import { Alert, Modal } from "react-native";
import { FilterDropdown } from "@/components/filter-dropdown";

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

  // Filtros (multi-seleção)
  const [selectedPosicoes, setSelectedPosicoes] = useState<string[]>([]);
  const [selectedClubes, setSelectedClubes] = useState<string[]>([]);
  const [selectedIdadeFaixas, setSelectedIdadeFaixas] = useState<number[]>([]);
  const [selectedNaturalidades, setSelectedNaturalidades] = useState<string[]>([]);
  
  // Seleção de atletas para relatório
  const [selectedAtletasIds, setSelectedAtletasIds] = useState<number[]>([]);

  const { data: atletas = [], isLoading, refetch } = trpc.atletas.list.useQuery();

  // Extrair posições e clubes únicos dos dados
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

  const naturalidades = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a) => { if (a.naturalidade) set.add(a.naturalidade); });
    return Array.from(set).sort();
  }, [atletas]);

  // Filtragem combinada (multi-seleção)
  const filteredAtletas = useMemo(() => {
    return atletas.filter((atleta) => {
      // Busca por nome
      if (searchQuery && !atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Filtro por posição (múltiplas)
      if (selectedPosicoes.length > 0 && !selectedPosicoes.includes(atleta.posicao || "")) {
        return false;
      }
      // Filtro por clube (múltiplos)
      if (selectedClubes.length > 0 && !selectedClubes.includes(atleta.clube || "")) {
        return false;
      }
      // Filtro por faixa de idade (múltiplas)
      if (selectedIdadeFaixas.length > 0) {
        const idade = atleta.idade ?? 0;
        const matchesFaixa = selectedIdadeFaixas.some((faixaIdx) => {
          const faixa = FAIXAS_IDADE[faixaIdx];
          return idade >= faixa.min && idade <= faixa.max;
        });
        if (!matchesFaixa) {
          return false;
        }
      }
      // Filtro por naturalidade
      if (selectedNaturalidades.length > 0 && !selectedNaturalidades.includes(atleta.naturalidade || "")) {
        return false;
      }
      return true;
    });
  }, [atletas, searchQuery, selectedPosicoes, selectedClubes, selectedIdadeFaixas, selectedNaturalidades]);

  const activeFilterCount = selectedPosicoes.length + selectedClubes.length + selectedIdadeFaixas.length + selectedNaturalidades.length;

  const clearFilters = () => {
    setSelectedPosicoes([]);
    setSelectedClubes([]);
    setSelectedIdadeFaixas([]);
    setSelectedNaturalidades([]);
  };

  // Ordenação
  const [sortBy, setSortBy] = useState<"nome" | "idade" | "altura">("nome");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);

  const sortedAtletas = useMemo(() => {
    const sorted = [...filteredAtletas];
    if (sortBy === "nome") {
      sorted.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (sortBy === "idade") {
      sorted.sort((a, b) => (b.idade ?? 0) - (a.idade ?? 0));
    } else if (sortBy === "altura") {
      sorted.sort((a, b) => (b.altura ?? 0) - (a.altura ?? 0));
    }
    return sorted;
  }, [filteredAtletas, sortBy]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleReportPress = () => {
    if (selectedAtletasIds.length === 0) {
      Alert.alert("Nenhum atleta selecionado", "Selecione pelo menos um atleta para gerar o relatório");
      return;
    }
    setShowReportConfirm(true);
  };

  const handleConfirmReport = async () => {
    setShowReportConfirm(false);
    setGeneratingPdf(true);
    try {
      const selectedAtletasData = sortedAtletas.filter((a) => selectedAtletasIds.includes(a.id));
      await generateReport(selectedAtletasData, selectedPosicoes, selectedClubes, selectedIdadeFaixas, selectedNaturalidades, searchQuery);
      Alert.alert("Sucesso", "Relatório PDF gerado com sucesso!");
      setSelectedAtletasIds([]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao gerar o relatório");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleExcelPress = async () => {
    setGeneratingExcel(true);
    try {
      const selectedAtletasData = sortedAtletas.filter((a) => selectedAtletasIds.includes(a.id));
      await generateExcel(selectedAtletasData);
      Alert.alert("Sucesso", "Arquivo Excel gerado com sucesso!");
      setSelectedAtletasIds([]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao gerar o arquivo Excel");
    } finally {
      setGeneratingExcel(false);
    }
  };

  const handleAddAtleta = () => {
    router.push("/atleta/novo");
  };

  const renderHeader = () => (
    <>
      <View className="bg-gradient-to-b from-primary/10 to-background px-4 pt-4 pb-3">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-3 flex-1">
            <Image
              source={require("@/assets/images/fabiano-scout-logo.png")}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
            <View>
              <Text className="text-2xl font-bold text-primary">Fabiano Scout</Text>
              <Text className="text-xs text-muted mt-0.5">Análise de Atletas</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => router.push("/relatorio")}
              className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center"
            >
              <IconSymbol name="doc.text" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/settings")}
              className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center"
            >
              <IconSymbol name="gearshape.fill" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de Busca */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-surface rounded-full px-4 py-3 border border-border flex-row items-center">
            <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
            <TextInput
              placeholder="Buscar atleta..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-foreground"
              style={{ color: colors.foreground }}
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
              backgroundColor: activeFilterCount > 0 ? colors.primary : colors.surface,
              borderWidth: activeFilterCount > 0 ? 0 : 1,
              borderColor: colors.border,
            }}
            className="rounded-full w-12 h-12 justify-center items-center"
          >
            <IconSymbol
              name="slider.horizontal.3"
              size={20}
              color={activeFilterCount > 0 ? "white" : colors.muted}
            />
            {activeFilterCount > 0 && (
              <View
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full justify-center items-center"
                style={{ backgroundColor: colors.error }}
              >
                <Text className="text-white text-xs font-bold">{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Contador de Resultados */}
      <View className="flex-row justify-between items-center mt-3 px-4">
        <Text className="text-sm text-muted">
          {filteredAtletas.length} atleta{filteredAtletas.length !== 1 ? "s" : ""} encontrado{filteredAtletas.length !== 1 ? "s" : ""}
        </Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={clearFilters}>
            <Text className="text-sm text-primary font-medium">Limpar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Painel de Filtros */}
      {showFilters && (
        <View className="bg-background border-b border-border px-4 pb-3 gap-3">
          {/* Filtro de Posições */}
          <FilterDropdown
            title="Posições"
            options={posicoes}
            selectedOptions={selectedPosicoes}
            onToggleOption={(pos) =>
              setSelectedPosicoes((prev) =>
                prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
              )
            }
          />

          {/* Filtro de Faixa de Idade */}
          <FilterDropdown
            title="Faixa de Idade"
            options={FAIXAS_IDADE.map((f) => f.label)}
            selectedOptions={selectedIdadeFaixas.map((idx) => FAIXAS_IDADE[idx].label)}
            onToggleOption={(label) => {
              const idx = FAIXAS_IDADE.findIndex((f) => f.label === label);
              if (idx !== -1) {
                setSelectedIdadeFaixas((prev) =>
                  prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                );
              }
            }}
          />

          {/* Filtro de Clubes */}
          <FilterDropdown
            title="Clubes"
            options={clubes}
            selectedOptions={selectedClubes}
            onToggleOption={(clube) =>
              setSelectedClubes((prev) =>
                prev.includes(clube) ? prev.filter((c) => c !== clube) : [...prev, clube]
              )
            }
          />

          {/* Filtro de Naturalidade */}
          <FilterDropdown
            title="Naturalidade"
            options={naturalidades}
            selectedOptions={selectedNaturalidades}
            onToggleOption={(nat) =>
              setSelectedNaturalidades((prev) =>
                prev.includes(nat) ? prev.filter((n) => n !== nat) : [...prev, nat]
              )
            }
          />
        </View>
      )}

      {/* Seção de Ordenação e Exportação */}
      <View className="px-4 py-3 flex-row justify-between items-center border-b border-border">
        <View className="flex-row gap-2 flex-1">
          <TouchableOpacity
            onPress={() => setSortBy("nome")}
            style={{
              backgroundColor: sortBy === "nome" ? colors.primary : colors.surface,
              borderWidth: sortBy === "nome" ? 0 : 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: sortBy === "nome" ? "white" : colors.foreground, fontSize: 12, fontWeight: "600" }}>Nome</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy("idade")}
            style={{
              backgroundColor: sortBy === "idade" ? colors.primary : colors.surface,
              borderWidth: sortBy === "idade" ? 0 : 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: sortBy === "idade" ? "white" : colors.foreground, fontSize: 12, fontWeight: "600" }}>Idade</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy("altura")}
            style={{
              backgroundColor: sortBy === "altura" ? colors.primary : colors.surface,
              borderWidth: sortBy === "altura" ? 0 : 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: sortBy === "altura" ? "white" : colors.foreground, fontSize: 12, fontWeight: "600" }}>Altura</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleExcelPress}
          disabled={generatingExcel}
          style={{ marginLeft: 8 }}
        >
          <IconSymbol name="square.and.arrow.down" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <ScreenContainer className="bg-background">
      <FlatList
        ListHeaderComponent={renderHeader}
        data={sortedAtletas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }: { item: any }) => {
          const isSelected = selectedAtletasIds.includes(item.id);
          return (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 12,
                backgroundColor: isSelected ? colors.primary + "20" : colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >

              {item.fotoUrl ? (
                <Image
                  source={{ uri: item.fotoUrl }}
                  style={{ width: 56, height: 56, borderRadius: 28, marginRight: 16 }}
                  resizeMode="cover"
                  progressiveRenderingEnabled={true}
                />
              ) : (
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary + "30",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}>
                    {item.nome.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (selectedAtletasIds.includes(item.id)) {
                    setSelectedAtletasIds(selectedAtletasIds.filter((id) => id !== item.id));
                  } else {
                    setSelectedAtletasIds([...selectedAtletasIds, item.id]);
                  }
                }}
                onLongPress={() => router.push(`/atleta/detalhes/${item.id}`)}
                style={{ flex: 1 }}
              >
                <View style={{ flexDirection: "column", gap: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                    {item.nome}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    {item.posicao && (
                      <View style={{ backgroundColor: colors.primary + "20", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "500" }}>
                          {item.posicao}
                        </Text>
                      </View>
                    )}
                    {item.clube && (
                      <View style={{ backgroundColor: colors.warning + "20", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 12, color: colors.warning, fontWeight: "500" }}>
                          {item.clube}
                        </Text>
                      </View>
                    )}
                    {item.idade != null && item.idade > 0 && (
                      <View style={{ backgroundColor: colors.success + "20", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 12, color: colors.success, fontWeight: "500" }}>
                          {item.idade} anos
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </View>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 justify-center items-center py-12">
              <IconSymbol name="magnifyingglass" size={48} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground mt-4">
                Nenhum atleta encontrado
              </Text>
              <Text className="text-sm text-muted text-center mt-2 px-6">
                {searchQuery || activeFilterCount > 0
                  ? "Tente ajustar sua busca ou filtros"
                  : "Comece adicionando um novo atleta"}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        scrollEnabled={true}
      />

      {/* Modal de Confirmação do Relatório */}
      <Modal
        visible={showReportConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportConfirm(false)}
      >
        <View
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 360,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            {/* Ícone do topo */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary + "20",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <IconSymbol name="doc.text.fill" size={28} color={colors.primary} />
              </View>
            </View>

            {/* Texto */}
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, textAlign: "center", marginBottom: 8 }}>
              Gerar Relatório
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 20 }}>
              {selectedAtletasIds.length} atleta{selectedAtletasIds.length !== 1 ? "s" : ""} selecionado{selectedAtletasIds.length !== 1 ? "s" : ""}
            </Text>

            {/* Resumo dos Filtros */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20, gap: 12 }}>
              {selectedPosicoes.length > 0 && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>Posição</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                    {selectedPosicoes.join(", ")}
                  </Text>
                </View>
              )}
              {selectedIdadeFaixas.length > 0 && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>Faixa de Idade</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                    {selectedIdadeFaixas.map(i => FAIXAS_IDADE[i].label).join(", ")}
                  </Text>
                </View>
              )}
              {selectedClubes.length > 0 && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>Clube</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
                    {selectedClubes.join(", ")}
                  </Text>
                </View>
              )}
              {selectedNaturalidades.length > 0 && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>Naturalidade</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
                    {selectedNaturalidades.join(", ")}
                  </Text>
                </View>
              )}
              {searchQuery ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>Busca</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
                    "{searchQuery}"
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Botões */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowReportConfirm(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReport}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: "white" }}>Gerar PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB - Botão Gerar Relatório */}
      <TouchableOpacity
        onPress={handleReportPress}
        disabled={generatingPdf}
        className="absolute bottom-8 right-24 w-14 h-14 rounded-full justify-center items-center"
        style={{
          backgroundColor: generatingPdf ? colors.muted : colors.foreground,
          shadowColor: colors.foreground,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        {generatingPdf ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <IconSymbol name="doc.text.fill" size={22} color={colors.background} />
        )}
      </TouchableOpacity>

      {/* FAB - Botão Adicionar */}
      <TouchableOpacity
        onPress={handleAddAtleta}
        className="absolute bottom-8 right-4 w-16 h-16 rounded-full bg-primary justify-center items-center"
        style={{
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text className="text-white text-3xl font-bold">+</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}
