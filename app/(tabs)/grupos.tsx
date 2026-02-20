import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface Grupo {
  id: number;
  nome: string;
  descricao?: string;
  cor: string;
  createdAt: Date;
}

interface AtletaEmGrupo {
  atletaId: number;
}

export default function GruposScreen() {
  const colors = useColors();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [novoGrupo, setNovoGrupo] = useState({ nome: "", descricao: "", cor: "#FF6B35" });
  const [atletasGrupo, setAtletasGrupo] = useState<AtletaEmGrupo[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);

  // Carregar grupos
  useEffect(() => {
    carregarGrupos();
  }, []);

  const carregarGrupos = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/grupos/list`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setGrupos(data.result || []);
      }
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    }
  };

  const handleCreateGrupo = async () => {
    if (!novoGrupo.nome.trim()) {
      alert("Nome do grupo é obrigatório");
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/grupos/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoGrupo.nome,
          descricao: novoGrupo.descricao || undefined,
          cor: novoGrupo.cor,
        }),
        credentials: "include",
      });

      if (response.ok) {
        setNovoGrupo({ nome: "", descricao: "", cor: "#FF6B35" });
        setModalVisible(false);
        carregarGrupos();
      }
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
    }
  };

  const handleDeleteGrupo = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este grupo?")) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/grupos/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      });

      if (response.ok) {
        carregarGrupos();
      }
    } catch (error) {
      console.error("Erro ao deletar grupo:", error);
    }
  };

  const handleSelectGrupo = async (grupo: Grupo) => {
    setSelectedGrupo(grupo);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/grupos/getAtletas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupoId: grupo.id }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAtletasGrupo(data.result || []);
      }
    } catch (error) {
      console.error("Erro ao carregar atletas do grupo:", error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.foreground,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 40,
    },
    emptyText: {
      color: colors.muted,
      fontSize: 14,
    },
    grupoCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    grupoCardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    grupoCardContent: {
      flex: 1,
    },
    grupoCardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.foreground,
    },
    grupoCardDescription: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
    },
    grupoCardCount: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
    },
    deleteButton: {
      padding: 8,
    },
    deleteButtonText: {
      color: colors.error,
      fontSize: 18,
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    fabText: {
      fontSize: 28,
      color: "white",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 40,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.foreground,
      marginBottom: 16,
    },
    fieldLabel: {
      color: colors.foreground,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: colors.foreground,
    },
    inputMultiline: {
      height: 80,
    },
    colorContainer: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    colorButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    cancelButtonText: {
      color: colors.foreground,
      fontWeight: "600",
    },
    createButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    createButtonText: {
      color: "white",
      fontWeight: "600",
    },
  });

  const renderGrupo = ({ item }: { item: Grupo }) => (
    <TouchableOpacity
      onPress={() => handleSelectGrupo(item)}
      style={[styles.grupoCard, { borderLeftColor: item.cor }]}
    >
      <View style={styles.grupoCardRow}>
        <View style={styles.grupoCardContent}>
          <Text style={styles.grupoCardTitle}>{item.nome}</Text>
          {item.descricao && (
            <Text style={styles.grupoCardDescription}>{item.descricao}</Text>
          )}
          <Text style={styles.grupoCardCount}>{atletasGrupo.length} atletas</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteGrupo(item.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grupos</Text>
      </View>

      {/* Conteúdo */}
      <ScrollView style={styles.content}>
        {grupos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum grupo criado ainda</Text>
          </View>
        ) : (
          <FlatList
            data={grupos}
            renderItem={renderGrupo}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Botão flutuante para criar grupo */}
      <TouchableOpacity
        onPress={() => {
          setEditingGrupo(null);
          setNovoGrupo({ nome: "", descricao: "", cor: "#FF6B35" });
          setModalVisible(true);
        }}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal para criar/editar grupo */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGrupo ? "Editar Grupo" : "Novo Grupo"}
            </Text>

            {/* Campo Nome */}
            <Text style={styles.fieldLabel}>Nome do Grupo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Titulares, Reservas, Monitorados"
              placeholderTextColor={colors.muted}
              value={novoGrupo.nome}
              onChangeText={(text) => setNovoGrupo({ ...novoGrupo, nome: text })}
            />

            {/* Campo Descrição */}
            <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Descrição do grupo"
              placeholderTextColor={colors.muted}
              value={novoGrupo.descricao}
              onChangeText={(text) => setNovoGrupo({ ...novoGrupo, descricao: text })}
              multiline
            />

            {/* Seletor de Cor */}
            <Text style={styles.fieldLabel}>Cor</Text>
            <View style={styles.colorContainer}>
              {["#FF6B35", "#FF1744", "#00BCD4", "#4CAF50", "#9C27B0", "#FFC107"].map((cor) => (
                <TouchableOpacity
                  key={cor}
                  onPress={() => setNovoGrupo({ ...novoGrupo, cor })}
                  style={[
                    styles.colorButton,
                    {
                      backgroundColor: cor,
                      borderWidth: novoGrupo.cor === cor ? 3 : 0,
                      borderColor: colors.foreground,
                    }
                  ]}
                />
              ))}
            </View>

            {/* Botões */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateGrupo}
                style={styles.createButton}
              >
                <Text style={styles.createButtonText}>
                  {editingGrupo ? "Atualizar" : "Criar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // Substitui porta 8081 pela 3000 (API)
    const apiPort = port === "8081" ? "3000" : port;
    return `${protocol}//${hostname}:${apiPort}`;
  }
  return "http://127.0.0.1:3000";
}
