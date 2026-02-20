import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function GaleriaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const [uploading, setUploading] = useState(false);

  const { data: atleta, isLoading: atletaLoading } = trpc.atletas.getById.useQuery(
    { id: Number(id) },
    { enabled: Boolean(id) }
  );

  const { data: midias, isLoading: midiasLoading } = trpc.midias.getByAtleta.useQuery(
    { atletaId: Number(id) },
    { enabled: Boolean(id) }
  );

  const deleteMidia = trpc.midias.delete.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Foto deletada com sucesso!");
    },
    onError: () => {
      Alert.alert("Erro", "Falha ao deletar foto");
    },
  });

  const handleAdicionarFoto = () => {
    if (Platform.OS === "web") {
      Alert.alert("Upload de Foto", "Clique no botão de upload abaixo para selecionar uma foto");
    } else {
      Alert.alert("Upload de Foto", "Use a câmera ou galeria para adicionar uma foto");
    }
  };

  const handleDeletarFoto = (midiaId: number) => {
    Alert.alert(
      "Deletar Foto",
      "Tem certeza que deseja deletar esta foto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            await deleteMidia.mutateAsync({ id: midiaId });
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    header: {
      backgroundColor: colors.primary + "20",
      paddingTop: 16,
      paddingBottom: 24,
      paddingHorizontal: 16,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    backButton: {
      backgroundColor: colors.background,
      borderRadius: 24,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.foreground,
      textAlign: "center",
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      marginTop: 8,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    emptyContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 32,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.foreground,
      textAlign: "center",
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      marginBottom: 24,
    },
    emptyButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    emptyButtonText: {
      color: "white",
      fontWeight: "600",
    },
    fotosContainer: {
      gap: 16,
      marginTop: 16,
    },
    fotoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    fotoImage: {
      width: "100%",
      height: 250,
    },
    fotoInfo: {
      padding: 16,
    },
    fotoHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    fotoContent: {
      flex: 1,
    },
    fotoName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.foreground,
    },
    fotoDescription: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 4,
    },
    deleteButton: {
      backgroundColor: colors.error + "15",
      borderRadius: 12,
      padding: 8,
    },
    fotoDate: {
      fontSize: 12,
      color: colors.muted,
    },
  });

  if (atletaLoading || midiasLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!atleta) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <IconSymbol name="person.crop.circle.badge.exclamationmark" size={64} color={colors.error} />
          <Text style={[styles.emptyTitle, { marginTop: 16 }]}>
            Atleta não encontrado
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.emptyButton, { marginTop: 16 }]}
          >
            <Text style={styles.emptyButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const fotos = midias?.filter((m) => m.tipo === "foto") || [];

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.foreground}
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdicionarFoto}
              style={styles.addButton}
            >
              <IconSymbol name="plus" size={18} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>
            Galeria de {atleta.nome}
          </Text>
          <Text style={styles.headerSubtitle}>
            {fotos.length} foto{fotos.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          {fotos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="photo.fill" size={48} color={colors.muted} />
              <Text style={styles.emptyTitle}>
                Nenhuma foto adicionada
              </Text>
              <Text style={styles.emptyText}>
                Clique no botão + para adicionar fotos do atleta
              </Text>
              <TouchableOpacity
                onPress={handleAdicionarFoto}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>Adicionar Foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fotosContainer}>
              {fotos.map((foto) => (
                <View
                  key={foto.id}
                  style={styles.fotoCard}
                >
                  {/* Imagem */}
                  {foto.url && (
                    <Image
                      source={{ uri: foto.url }}
                      style={styles.fotoImage}
                      resizeMode="cover"
                    />
                  )}

                  {/* Informações */}
                  <View style={styles.fotoInfo}>
                    <View style={styles.fotoHeader}>
                      <View style={styles.fotoContent}>
                        <Text style={styles.fotoName}>
                          {foto.nome}
                        </Text>
                        {foto.descricao && (
                          <Text style={styles.fotoDescription}>
                            {foto.descricao}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeletarFoto(foto.id)}
                        style={styles.deleteButton}
                      >
                        <IconSymbol name="trash" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>

                    {/* Data */}
                    <Text style={styles.fotoDate}>
                      {new Date(foto.createdAt).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
