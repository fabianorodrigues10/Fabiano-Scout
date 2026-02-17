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
  const [selectedIdadeFaixa, setSelectedIdadeFaixa] = useState(0); // index em FAIXAS_IDADE

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
    const faixa = FAIXAS_IDADE[selectedIdadeFaixa];
    return atletas.filter((atleta) => {
      // Busca por nome
      if (searchQuery && !atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Filtro por posição
      if (selectedPosicao && atleta.posicao !== selectedPosicao) {
        return false;
      }
      // Filtro por clube
      if (selectedClube && atleta.clube !== selectedClube) {
        return false;
      }
      // Filtro por faixa de idade
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

  const handleAddAtleta = () => {
    router.push("/atleta/novo" as any);
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

          {/* Filtro por Faixa de Idade */}
          <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Faixa de Idade
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              {FAIXAS_IDADE.map((faixa, idx) => (
                <TouchableOpacity
                  key={faixa.label}
                  onPress={() => setSelectedIdadeFaixa(idx)}
                  style={{
                    backgroundColor: selectedIdadeFaixa === idx ? colors.primary : colors.surface,
                    borderWidth: selectedIdadeFaixa === idx ? 0 : 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: selectedIdadeFaixa === idx ? "white" : colors.foreground,
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

          {/* Filtro por Clube */}
          <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Clube
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setSelectedClube(null)}
                style={{
                  backgroundColor: !selectedClube ? colors.primary : colors.surface,
                  borderWidth: !selectedClube ? 0 : 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    color: !selectedClube ? "white" : colors.foreground,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
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
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: selectedClube === clube ? "white" : colors.foreground,
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
      <FlatList
        data={filteredAtletas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            onPress={() => handleAtletaPress(item.id)}
            className="mx-4 mb-3 bg-surface rounded-2xl p-4 border border-border flex-row items-center"
            style={{
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View className="w-14 h-14 rounded-full bg-primary/20 justify-center items-center mr-4">
              <Text className="text-primary font-bold text-lg">
                {item.nome?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {item.nome || "Sem nome"}
              </Text>
              <View className="flex-row gap-2 mt-1 flex-wrap">
                {item.posicao && (
                  <View className="bg-primary/10 rounded-full px-2 py-1">
                    <Text className="text-xs text-primary font-medium">
                      {item.posicao}
                    </Text>
                  </View>
                )}
                {item.clube && (
                  <View className="bg-muted/10 rounded-full px-2 py-1">
                    <Text className="text-xs text-muted font-medium" numberOfLines={1}>
                      {item.clube}
                    </Text>
                  </View>
                )}
                {item.idade != null && item.idade > 0 && (
                  <View className="bg-success/10 rounded-full px-2 py-1">
                    <Text className="text-xs text-success font-medium">
                      {item.idade} anos
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        )}
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
