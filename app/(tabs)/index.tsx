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
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { generateReport } from "@/lib/report";
import { Alert, Modal } from "react-native";

const FAIXAS_IDADE = [
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

  // Filtros - agora com múltiplas seleções
  const [selectedPosicao, setSelectedPosicao] = useState<string | null>(null);
  const [selectedClubes, setSelectedClubes] = useState<Set<string>>(new Set()); // múltiplos clubes
  const [selectedIdadeFaixas, setSelectedIdadeFaixas] = useState<Set<number>>(new Set()); // múltiplas faixas

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

  // Filtragem combinada
  const filteredAtletas = useMemo(() => {
    return atletas.filter((atleta) => {
      // Busca por nome
      if (searchQuery && !atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Filtro por posição
      if (selectedPosicao && atleta.posicao !== selectedPosicao) {
        return false;
      }
      // Filtro por clube (múltiplos)
      if (selectedClubes.size > 0 && !selectedClubes.has(atleta.clube || "")) {
        return false;
      }
      // Filtro por faixa de idade (múltiplas)
      if (selectedIdadeFaixas.size > 0) {
        const idade = atleta.idade ?? 0;
        let matchesAnyFaixa = false;
        selectedIdadeFaixas.forEach((idx) => {
          const faixa = FAIXAS_IDADE[idx];
          if (idade >= faixa.min && idade <= faixa.max) {
            matchesAnyFaixa = true;
          }
        });
        if (!matchesAnyFaixa) {
          return false;
        }
      }
      return true;
    });
  }, [atletas, searchQuery, selectedPosicao, selectedClubes, selectedIdadeFaixas]);

  const activeFilterCount = (selectedPosicao ? 1 : 0) + (selectedClubes.size > 0 ? 1 : 0) + (selectedIdadeFaixas.size > 0 ? 1 : 0);

  const clearFilters = () => {
    setSelectedPosicao(null);
    setSelectedClubes(new Set());
    setSelectedIdadeFaixas(new Set());
  };

  const toggleClube = (clube: string) => {
    const newClubes = new Set(selectedClubes);
    if (newClubes.has(clube)) {
      newClubes.delete(clube);
    } else {
      newClubes.add(clube);
    }
    setSelectedClubes(newClubes);
  };

  const toggleIdadeFaixa = (idx: number) => {
    const newFaixas = new Set(selectedIdadeFaixas);
    if (newFaixas.has(idx)) {
      newFaixas.delete(idx);
    } else {
      newFaixas.add(idx);
    }
    setSelectedIdadeFaixas(newFaixas);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);

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
      
      // Construir descrição dos filtros aplicados
      const filtrosAplicados = [];
      if (selectedPosicao) filtrosAplicados.push(`Posição: ${selectedPosicao}`);
      if (selectedClubes.size > 0) {
        const clubesStr = Array.from(selectedClubes).join(", ");
        filtrosAplicados.push(`Clubes: ${clubesStr}`);
      }
      if (selectedIdadeFaixas.size > 0) {
        const faixasStr = Array.from(selectedIdadeFaixas)
          .map((idx) => FAIXAS_IDADE[idx].label)
          .join(", ");
        filtrosAplicados.push(`Idades: ${faixasStr}`);
      }
      if (searchQuery) filtrosAplicados.push(`Busca: ${searchQuery}`);

      const filters = {
        posicao: selectedPosicao || null,
        clube: selectedClubes.size > 0 ? Array.from(selectedClubes).join(", ") : null,
        faixaIdade: selectedIdadeFaixas.size > 0 ? Array.from(selectedIdadeFaixas).map((idx) => FAIXAS_IDADE[idx].label).join(", ") : null,
        busca: searchQuery || null,
      };
      await generateReport(ids, filters as any);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível gerar o relatório.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleAtletaPress = (id: number) => {
    router.push(`/atleta/detalhes/${id}` as any);
  };

  return (
    <ScreenContainer className="bg-background">
      {/* Header com Logo */}
      <View className="bg-gradient-to-b from-primary/10 to-background px-4 pt-4 pb-3">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-3xl font-bold text-primary">Fabiano Scout</Text>
            <Text className="text-sm text-muted mt-1">Análise de Atletas</Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-primary/20 justify-center items-center">
            <IconSymbol name="person.fill" size={24} color={colors.primary} />
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

        {/* Contador de Resultados */}
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-sm text-muted">
            {filteredAtletas.length} atleta{filteredAtletas.length !== 1 ? "s" : ""} encontrado{filteredAtletas.length !== 1 ? "s" : ""}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-sm text-primary font-medium">Limpar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Painel de Filtros */}
      {showFilters && (
        <View className="px-4 pb-3 bg-background border-b border-border">
          {/* Filtro por Posição */}
          <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 mt-2">
            Posição
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setSelectedPosicao(null)}
                style={{
                  backgroundColor: !selectedPosicao ? colors.primary : colors.surface,
                  borderWidth: !selectedPosicao ? 0 : 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    color: !selectedPosicao ? "white" : colors.foreground,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Todas
                </Text>
              </TouchableOpacity>
              {posicoes.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => setSelectedPosicao(selectedPosicao === pos ? null : pos)}
                  style={{
                    backgroundColor: selectedPosicao === pos ? colors.primary : colors.surface,
                    borderWidth: selectedPosicao === pos ? 0 : 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: selectedPosicao === pos ? "white" : colors.foreground,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Filtro por Faixa de Idade - MÚLTIPLAS SELEÇÕES */}
          <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Faixa de Idade
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              {FAIXAS_IDADE.map((faixa, idx) => (
                <TouchableOpacity
                  key={faixa.label}
                  onPress={() => toggleIdadeFaixa(idx)}
                  style={{
                    backgroundColor: selectedIdadeFaixas.has(idx) ? colors.primary : colors.surface,
                    borderWidth: selectedIdadeFaixas.has(idx) ? 0 : 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: selectedIdadeFaixas.has(idx) ? "white" : colors.foreground,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {faixa.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Filtro por Clube - MÚLTIPLAS SELEÇÕES */}
          <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Clube
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row gap-2">
              {clubes.map((clube) => (
                <TouchableOpacity
                  key={clube}
                  onPress={() => toggleClube(clube)}
                  style={{
                    backgroundColor: selectedClubes.has(clube) ? colors.primary : colors.surface,
                    borderWidth: selectedClubes.has(clube) ? 0 : 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: selectedClubes.has(clube) ? "white" : colors.foreground,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                    numberOfLines={1}
                  >
                    {clube}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Lista de Atletas */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAtletas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleAtletaPress(item.id)}
              activeOpacity={0.7}
              className="mx-4 mb-3 bg-surface rounded-lg p-4 border border-border flex-row items-center"
            >
              <View
                className="w-12 h-12 rounded-lg justify-center items-center mr-3"
                style={{ backgroundColor: colors.primary + "20" }}
              >
                <Text className="text-lg font-bold text-primary">
                  {item.nome.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">{item.nome}</Text>
                <View className="flex-row gap-2 mt-1">
                  <Text className="text-xs font-medium text-primary">{item.posicao}</Text>
                  <Text className="text-xs text-muted">{item.clube}</Text>
                  {item.idade && (
                    <Text className="text-xs text-muted">{item.idade} anos</Text>
                  )}
                </View>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingVertical: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-12">
              <IconSymbol name="magnifyingglass" size={48} color={colors.muted} />
              <Text className="text-muted mt-4 text-center">Nenhum atleta encontrado</Text>
            </View>
          }
        />
      )}

      {/* FABs */}
      <View className="absolute bottom-6 right-6 gap-3">
        <TouchableOpacity
          onPress={handleReportPress}
          disabled={generatingPdf}
          style={{
            backgroundColor: colors.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: "center",
            alignItems: "center",
            opacity: generatingPdf ? 0.6 : 1,
          }}
        >
          {generatingPdf ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <IconSymbol name="doc.fill" size={24} color="white" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAddAtleta}
          style={{
            backgroundColor: colors.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconSymbol name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Modal de Confirmação do Relatório */}
      <Modal
        visible={showReportConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportConfirm(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View
            className="bg-background rounded-2xl p-6 w-full max-w-sm"
            style={{ borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-xl font-bold text-foreground mb-2">Gerar Relatório</Text>
            <Text className="text-sm text-muted mb-4">
              Serão incluídos {filteredAtletas.length} atleta{filteredAtletas.length !== 1 ? "s" : ""} no relatório.
            </Text>

            {/* Resumo dos Filtros */}
            {(selectedPosicao || selectedClubes.size > 0 || selectedIdadeFaixas.size > 0 || searchQuery) && (
              <View className="bg-surface rounded-lg p-3 mb-4 border border-border">
                <Text className="text-xs font-semibold text-muted uppercase mb-2">Filtros Aplicados</Text>
                {selectedPosicao && (
                  <Text className="text-sm text-foreground">• Posição: {selectedPosicao}</Text>
                )}
                {selectedClubes.size > 0 && (
                  <Text className="text-sm text-foreground">
                    • Clubes: {Array.from(selectedClubes).join(", ")}
                  </Text>
                )}
                {selectedIdadeFaixas.size > 0 && (
                  <Text className="text-sm text-foreground">
                    • Idades: {Array.from(selectedIdadeFaixas)
                      .map((idx) => FAIXAS_IDADE[idx].label)
                      .join(", ")}
                  </Text>
                )}
                {searchQuery && (
                  <Text className="text-sm text-foreground">• Busca: {searchQuery}</Text>
                )}
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowReportConfirm(false)}
                className="flex-1 bg-surface rounded-lg py-3 border border-border justify-center items-center"
              >
                <Text className="text-foreground font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReport}
                className="flex-1 rounded-lg py-3 justify-center items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-semibold">Gerar Relatório</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
