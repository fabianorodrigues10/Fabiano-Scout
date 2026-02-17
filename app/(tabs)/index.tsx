import { useState, useCallback } from "react";
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

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: atletas = [], isLoading, refetch } = trpc.atletas.list.useQuery();

  const filteredAtletas = atletas.filter((atleta) =>
    atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAddAtleta = () => {
    router.push("/atleta/novo" as any);
  };

  const handleOpenFilters = () => {
    router.push("/filtros" as any);
  };

  const handleAtletaPress = (id: number) => {
    router.push(`/atleta/detalhes/${id}` as any);
  };

  return (
    <ScreenContainer className="bg-background">
      {/* Header com Logo */}
      <View className="bg-gradient-to-b from-primary/10 to-background px-4 pt-4 pb-6">
        <View className="flex-row justify-between items-center mb-6">
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
            />
          </View>

          <TouchableOpacity
            onPress={handleOpenFilters}
            className="bg-primary rounded-full w-12 h-12 justify-center items-center"
          >
            <IconSymbol name="slider.horizontal.3" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Contador de Resultados */}
        <Text className="text-sm text-muted mt-3">
          {filteredAtletas.length} atleta{filteredAtletas.length !== 1 ? "s" : ""} encontrado{filteredAtletas.length !== 1 ? "s" : ""}
        </Text>
      </View>

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
              <View className="flex-row gap-2 mt-1">
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
                {searchQuery
                  ? "Tente ajustar sua busca"
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
        contentContainerStyle={{ paddingBottom: 100 }}
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
