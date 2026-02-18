import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, logout } = useAuth();
  
  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-2xl font-bold text-foreground mb-6">
            Configurações
          </Text>
          
          {/* Informações do usuário */}
          {user && (
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-sm text-muted mb-1">Usuário</Text>
              <Text className="text-lg font-semibold text-foreground">
                {user.name || user.email || "Sem nome"}
              </Text>
              {user.email && (
                <Text className="text-sm text-muted mt-1">{user.email}</Text>
              )}
            </View>
          )}
          
          {/* Seção de Atualização */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Atualização de Dados
            </Text>
            
            <TouchableOpacity
              onPress={() => router.push("/atualizar-ogol" as any)}
              className="bg-primary/10 rounded-xl p-4 border border-primary/30 flex-row justify-between items-center mb-4"
            >
              <View className="flex-1">
                <Text className="text-base font-medium text-primary">
                  Atualizar do Ogol
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Completar data de nascimento e idade
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color="#FF6B35"
              />
            </TouchableOpacity>
          </View>
          
          {/* Seção de Campos */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Gerenciamento de Campos
            </Text>
            
            <TouchableOpacity className="bg-surface rounded-xl p-4 mb-2 border border-border flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">
                  Campos Padrão
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Ativar ou desativar campos padrão
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.muted}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push("/campos-customizados" as any)}
              className="bg-surface rounded-xl p-4 border border-border flex-row justify-between items-center"
            >
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">
                  Campos Customizados
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Criar e gerenciar campos personalizados
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>
          
          {/* Seção de Conta */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Conta
            </Text>
            
            <TouchableOpacity
              onPress={logout}
              className="bg-error/10 rounded-xl p-4 border border-error/30"
            >
              <Text className="text-base font-medium text-error text-center">
                Sair da Conta
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Informações do App */}
          <View className="items-center mt-8 mb-4">
            <Text className="text-xs text-muted">
              Atletas Futebol v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
