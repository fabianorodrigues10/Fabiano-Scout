import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

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

  const renderGrupo = ({ item }: { item: Grupo }) => (
    <TouchableOpacity
      onPress={() => handleSelectGrupo(item)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: item.cor,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            {item.nome}
          </Text>
          {item.descricao && (
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {item.descricao}
            </Text>
          )}
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            {atletasGrupo.length} atletas
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteGrupo(item.id)}
          style={{ padding: 8 }}
        >
          <Text style={{ color: colors.error, fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>Grupos</Text>
      </View>

      {/* Conteúdo */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {grupos.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", marginTop: 40 }}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>Nenhum grupo criado ainda</Text>
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
        style={{
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
        }}
      >
        <Text style={{ fontSize: 28, color: "white" }}>+</Text>
      </TouchableOpacity>

      {/* Modal para criar/editar grupo */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 40,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
              {editingGrupo ? "Editar Grupo" : "Novo Grupo"}
            </Text>

            {/* Campo Nome */}
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
              Nome do Grupo
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: colors.foreground,
              }}
              placeholder="Ex: Titulares, Reservas, Monitorados"
              placeholderTextColor={colors.muted}
              value={novoGrupo.nome}
              onChangeText={(text) => setNovoGrupo({ ...novoGrupo, nome: text })}
            />

            {/* Campo Descrição */}
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
              Descrição (opcional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: colors.foreground,
                height: 80,
              }}
              placeholder="Descrição do grupo"
              placeholderTextColor={colors.muted}
              value={novoGrupo.descricao}
              onChangeText={(text) => setNovoGrupo({ ...novoGrupo, descricao: text })}
              multiline
            />

            {/* Seletor de Cor */}
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
              Cor
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {["#FF6B35", "#FF1744", "#00BCD4", "#4CAF50", "#9C27B0", "#FFC107"].map((cor) => (
                <TouchableOpacity
                  key={cor}
                  onPress={() => setNovoGrupo({ ...novoGrupo, cor })}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: cor,
                    borderWidth: novoGrupo.cor === cor ? 3 : 0,
                    borderColor: colors.foreground,
                  }}
                />
              ))}
            </View>

            {/* Botões */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateGrupo}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
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
