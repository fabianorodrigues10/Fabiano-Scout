import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AtletaCard } from "@/components/atleta-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function AtletasScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filtrosAtivos, setFiltrosAtivos] = useState<any>({});
  
  // Query para buscar atletas
  const { data: atletas, isLoading, refetch } = trpc.atletas.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Filtra atletas localmente por nome
  const atletasFiltrados = useMemo(() => {
    if (!atletas) return [];
    
    if (!searchQuery.trim()) {
      return atletas;
    }
    
    const query = searchQuery.toLowerCase();
    return atletas.filter((atleta) =>
      atleta.nome.toLowerCase().includes(query)
    );
  }, [atletas, searchQuery]);
  
  const handleAtletaPress = (atletaId: number) => {
    router.push(`/atleta/detalhes/${atletaId}` as any);
  };
  
  const handleNovoAtleta = () => {
    router.push("/atleta/novo" as any);
  };
  
  const handleFiltros = () => {
    router.push("/filtros" as any);
  };
  
  if (authLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-lg text-foreground text-center mb-4">
          Faça login para gerenciar seus atletas
        </Text>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header com busca e filtros */}
        <View className="px-4 pt-4 pb-3 bg-background border-b border-border">
          <Text className="text-2xl font-bold text-foreground mb-3">
            Atletas
          </Text>
          
          <View className="flex-row gap-2">
            {/* Barra de busca */}
            <View className="flex-1 flex-row items-center bg-surface rounded-lg px-3 py-2 border border-border">
              <IconSymbol
                name="magnifyingglass"
                size={20}
                color={colors.muted}
              />
              <TextInput
                className="flex-1 ml-2 text-foreground"
                placeholder="Buscar atleta..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <IconSymbol name="xmark" size={18} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Botão de filtros */}
            <TouchableOpacity
              onPress={handleFiltros}
              className="bg-surface rounded-lg px-3 py-2 border border-border justify-center items-center"
              style={{ width: 48 }}
            >
              <IconSymbol
                name="line.3.horizontal.decrease"
                size={20}
                color={colors.foreground}
              />
            </TouchableOpacity>
          </View>
          
          {/* Contador de resultados */}
          <Text className="text-sm text-muted mt-2">
            {atletasFiltrados.length} {atletasFiltrados.length === 1 ? "atleta" : "atletas"}
          </Text>
        </View>
        
        {/* Lista de atletas */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : atletasFiltrados.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <Text className="text-lg text-muted text-center mb-2">
              {searchQuery
                ? "Nenhum atleta encontrado"
                : "Nenhum atleta cadastrado"}
            </Text>
            <Text className="text-sm text-muted text-center mb-6">
              {searchQuery
                ? "Tente buscar com outro termo"
                : "Toque no botão + para cadastrar seu primeiro atleta"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={atletasFiltrados}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <AtletaCard
                atleta={item}
                onPress={() => handleAtletaPress(item.id)}
              />
            )}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 100,
            }}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => refetch()}
                tintColor={colors.primary}
              />
            }
          />
        )}
        
        {/* FAB - Botão flutuante para adicionar */}
        <TouchableOpacity
          onPress={handleNovoAtleta}
          className="absolute bottom-6 right-6 bg-primary rounded-full w-14 h-14 justify-center items-center shadow-lg"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <IconSymbol name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
