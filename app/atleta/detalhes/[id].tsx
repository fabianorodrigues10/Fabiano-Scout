import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function AtletaDetalhesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  
  const { data: atleta, isLoading } = trpc.atletas.getById.useQuery(
    { id: Number(id) },
    { enabled: Boolean(isAuthenticated && id) }
  );
  
  const handleEditar = () => {
    router.push(`/atleta/${id}` as any);
  };
  
  const handleAbrirLink = () => {
    if (atleta?.link) {
      Linking.openURL(atleta.link);
    }
  };
  
  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }
  
  if (!atleta) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-lg text-muted text-center">
          Atleta não encontrado
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-primary rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-3 bg-background border-b border-border flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <IconSymbol
                name="chevron.right"
                size={24}
                color={colors.foreground}
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
              {atleta.nome}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleEditar}>
            <IconSymbol name="pencil" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Conteúdo */}
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Informações Básicas */}
          <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Informações Básicas
            </Text>
            
            <InfoRow label="Nome" value={atleta.nome} />
            {atleta.posicao && <InfoRow label="Posição" value={atleta.posicao} />}
            {atleta.segundaPosicao && (
              <InfoRow label="2ª Posição" value={atleta.segundaPosicao} />
            )}
            {atleta.clube && <InfoRow label="Clube" value={atleta.clube} />}
          </View>
          
          {/* Dados Físicos */}
          {(atleta.dataNascimento || atleta.idade || atleta.altura || atleta.pe) && (
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Dados Físicos
              </Text>
              
              {atleta.dataNascimento && (
                <InfoRow
                  label="Data de Nascimento"
                  value={new Date(atleta.dataNascimento).toLocaleDateString("pt-BR")}
                />
              )}
              {atleta.idade && (
                <InfoRow label="Idade" value={`${atleta.idade} anos`} />
              )}
              {atleta.altura && (
                <InfoRow label="Altura" value={`${atleta.altura} cm`} />
              )}
              {atleta.pe && (
                <InfoRow
                  label="Pé"
                  value={atleta.pe.charAt(0).toUpperCase() + atleta.pe.slice(1)}
                />
              )}
            </View>
          )}
          
          {/* Avaliação */}
          {(atleta.escala || atleta.valencia) && (
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Avaliação
              </Text>
              
              {atleta.escala && <InfoRow label="Escala" value={atleta.escala} />}
              {atleta.valencia && <InfoRow label="Valência" value={atleta.valencia} />}
            </View>
          )}
          
          {/* Link */}
          {atleta.link && (
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Link
              </Text>
              
              <TouchableOpacity
                onPress={handleAbrirLink}
                className="bg-primary/10 rounded-lg p-3 flex-row items-center"
              >
                <Text className="flex-1 text-primary" numberOfLines={1}>
                  {atleta.link}
                </Text>
                <IconSymbol name="chevron.right" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-start py-2 border-b border-border/50 last:border-b-0">
      <Text className="text-sm text-muted flex-1">{label}</Text>
      <Text className="text-sm text-foreground font-medium flex-1 text-right">
        {value}
      </Text>
    </View>
  );
}
