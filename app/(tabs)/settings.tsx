import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, logout } = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.foreground,
      marginBottom: 24,
    },
    userCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userLabel: {
      fontSize: 14,
      color: colors.muted,
      marginBottom: 4,
    },
    userName: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.foreground,
    },
    userEmail: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 12,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardOgol: {
      backgroundColor: colors.primary + "15",
      borderColor: colors.primary + "50",
    },
    cardPhoto: {
      backgroundColor: "#DBEAFE",
      borderColor: "#BFDBFE",
    },
    cardError: {
      backgroundColor: colors.error + "15",
      borderColor: colors.error + "50",
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 4,
    },
    cardTitleOgol: {
      color: colors.primary,
    },
    cardTitlePhoto: {
      color: "#1e3a8a",
    },
    cardTitleDefault: {
      color: colors.foreground,
    },
    cardSubtitle: {
      fontSize: 14,
      marginTop: 4,
    },
    cardSubtitleOgol: {
      color: colors.muted,
    },
    cardSubtitlePhoto: {
      color: "#1e40af",
    },
    cardSubtitleDefault: {
      color: colors.muted,
    },
    logoutButton: {
      backgroundColor: colors.error + "15",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.error + "50",
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.error,
      textAlign: "center",
    },
    footer: {
      alignItems: "center",
      marginTop: 32,
      marginBottom: 16,
    },
    footerText: {
      fontSize: 12,
      color: colors.muted,
    },
  });
  
  return (
    <ScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Configurações</Text>
        
        {/* Informações do usuário */}
        {user && (
          <View style={styles.userCard}>
            <Text style={styles.userLabel}>Usuário</Text>
            <Text style={styles.userName}>
              {user.name || user.email || "Sem nome"}
            </Text>
            {user.email && (
              <Text style={styles.userEmail}>{user.email}</Text>
            )}
          </View>
        )}
        
        {/* Seção de Atualização */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atualização de Dados</Text>
          
          <TouchableOpacity
            onPress={() => router.push("/atualizar-ogol" as any)}
            style={[styles.card, styles.cardOgol]}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, styles.cardTitleOgol]}>
                Atualizar do Ogol
              </Text>
              <Text style={[styles.cardSubtitle, styles.cardSubtitleOgol]}>
                Completar data de nascimento e idade
              </Text>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/testar-foto" as any)}
            style={[styles.card, styles.cardPhoto]}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, styles.cardTitlePhoto]}>
                Testar Extracao de Foto
              </Text>
              <Text style={[styles.cardSubtitle, styles.cardSubtitlePhoto]}>
                Teste a extracao de foto do Ogol
              </Text>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color="#1e40af"
            />
          </TouchableOpacity>
        </View>
        
        {/* Seção de Campos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gerenciamento de Campos</Text>
          
          <TouchableOpacity style={[styles.card]}>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, styles.cardTitleDefault]}>
                Campos Padrao
              </Text>
              <Text style={[styles.cardSubtitle, styles.cardSubtitleDefault]}>
                Ativar ou desativar campos padrao
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
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, styles.cardTitleDefault]}>
                Campos Customizados
              </Text>
              <Text style={[styles.cardSubtitle, styles.cardSubtitleDefault]}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          
          <TouchableOpacity
            onPress={logout}
            style={[styles.card, styles.cardError]}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.error, textAlign: "center" }]}>
                Sair da Conta
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Informações do App */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Atletas Futebol v1.0.0
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
