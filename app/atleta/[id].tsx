import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const POSICOES = [
  "Goleiro",
  "Lateral Direito",
  "Lateral Esquerdo",
  "Zagueiro",
  "Volante",
  "Meia",
  "Atacante",
  "Ponta Direita",
  "Ponta Esquerda",
  "Centroavante",
];

const PES = ["direito", "esquerdo", "ambidestro"];

export default function AtletaFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  
  const isEdit = Boolean(id && id !== "novo");
  
  // Estados do formulário
  const [nome, setNome] = useState("");
  const [posicao, setPosicao] = useState("");
  const [segundaPosicao, setSegundaPosicao] = useState("");
  const [clube, setClube] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [idade, setIdade] = useState("");
  const [altura, setAltura] = useState("");
  const [pe, setPe] = useState("");
  const [link, setLink] = useState("");
  const [escala, setEscala] = useState("");
  const [valencia, setValencia] = useState("");
  
  // Query para buscar atleta (se editando)
  const { data: atleta, isLoading: loadingAtleta } = trpc.atletas.getById.useQuery(
    { id: Number(id) },
    { enabled: Boolean(isAuthenticated && isEdit) }
  );
  
  // Mutations
  const createMutation = trpc.atletas.create.useMutation();
  const updateMutation = trpc.atletas.update.useMutation();
  const deleteMutation = trpc.atletas.delete.useMutation();
  
  // Carrega dados do atleta ao editar
  useEffect(() => {
    if (atleta) {
      setNome(atleta.nome);
      setPosicao(atleta.posicao || "");
      setSegundaPosicao(atleta.segundaPosicao || "");
      setClube(atleta.clube || "");
      setDataNascimento(atleta.dataNascimento?.toString() || "");
      setIdade(atleta.idade?.toString() || "");
      setAltura(atleta.altura || "");
      setPe(atleta.pe || "");
      setLink(atleta.link || "");
      setEscala(atleta.escala || "");
      setValencia(atleta.valencia || "");
    }
  }, [atleta]);
  
  // Calcula idade automaticamente
  useEffect(() => {
    if (dataNascimento) {
      try {
        const nascimento = new Date(dataNascimento);
        const hoje = new Date();
        let idadeCalculada = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
          idadeCalculada--;
        }
        setIdade(idadeCalculada.toString());
      } catch (e) {
        // Data inválida
      }
    }
  }, [dataNascimento]);
  
  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome do atleta é obrigatório");
      return;
    }
    
    try {
      const data = {
        nome: nome.trim(),
        posicao: posicao || undefined,
        segundaPosicao: segundaPosicao || undefined,
        clube: clube || undefined,
        dataNascimento: dataNascimento || undefined,
        idade: idade ? Number(idade) : undefined,
        altura: altura ? Number(altura) : undefined,
        pe: pe as any || undefined,
        link: link || undefined,
        escala: escala || undefined,
        valencia: valencia || undefined,
      };
      
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: Number(id),
          ...data,
        });
        Alert.alert("Sucesso", "Atleta atualizado com sucesso");
      } else {
        await createMutation.mutateAsync(data);
        Alert.alert("Sucesso", "Atleta cadastrado com sucesso");
      }
      
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar atleta");
    }
  };
  
  const handleExcluir = () => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este atleta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id: Number(id) });
              Alert.alert("Sucesso", "Atleta excluído com sucesso");
              router.back();
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Erro ao excluir atleta");
            }
          },
        },
      ]
    );
  };
  
  if (loadingAtleta) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }
  
  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  
  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-3 bg-background border-b border-border flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <IconSymbol name="chevron.right" size={24} color={colors.foreground} style={{ transform: [{ rotate: "180deg" }] }} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-foreground">
              {isEdit ? "Editar Atleta" : "Novo Atleta"}
            </Text>
          </View>
          
          {isEdit && (
            <TouchableOpacity onPress={handleExcluir} disabled={isLoading}>
              <IconSymbol name="trash" size={22} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Formulário */}
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Nome */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Nome do Atleta *
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Ex: Neymar Jr"
              placeholderTextColor={colors.muted}
              value={nome}
              onChangeText={setNome}
            />
          </View>
          
          {/* Posição */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Posição Principal
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Ex: Atacante"
              placeholderTextColor={colors.muted}
              value={posicao}
              onChangeText={setPosicao}
            />
          </View>
          
          {/* Segunda Posição */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Segunda Posição
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Ex: Ponta Esquerda"
              placeholderTextColor={colors.muted}
              value={segundaPosicao}
              onChangeText={setSegundaPosicao}
            />
          </View>
          
          {/* Clube */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Clube
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Ex: Al-Hilal"
              placeholderTextColor={colors.muted}
              value={clube}
              onChangeText={setClube}
            />
          </View>
          
          {/* Data de Nascimento */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Data de Nascimento
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="AAAA-MM-DD (Ex: 1992-02-05)"
              placeholderTextColor={colors.muted}
              value={dataNascimento}
              onChangeText={setDataNascimento}
            />
          </View>
          
          {/* Idade */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Idade
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Calculada automaticamente"
              placeholderTextColor={colors.muted}
              value={idade}
              onChangeText={setIdade}
              keyboardType="numeric"
              editable={!dataNascimento}
            />
          </View>
          
          {/* Altura */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Altura (cm)
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Ex: 175"
              placeholderTextColor={colors.muted}
              value={altura}
              onChangeText={setAltura}
              keyboardType="numeric"
            />
          </View>
          
          {/* Pé */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Pé Preferencial
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="direito, esquerdo ou ambidestro"
              placeholderTextColor={colors.muted}
              value={pe}
              onChangeText={setPe}
            />
          </View>
          
          {/* Link */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Link
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="URL de vídeo ou perfil"
              placeholderTextColor={colors.muted}
              value={link}
              onChangeText={setLink}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
          
          {/* Escala */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Escala
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Ex: A, B, C"
              placeholderTextColor={colors.muted}
              value={escala}
              onChangeText={setEscala}
            />
          </View>
          
          {/* Valências */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-medium text-foreground">
                Valências
              </Text>
              <Text className="text-xs text-muted">
                {valencia.length}/500
              </Text>
            </View>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Descreva as características e valências do atleta (velocidade, técnica, visão de jogo, liderança...)"
              placeholderTextColor={colors.muted}
              value={valencia}
              onChangeText={(text) => setValencia(text.slice(0, 500))}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={{ minHeight: 120 }}
            />
          </View>
          
          <View className="h-20" />
        </ScrollView>
        
        {/* Botões fixos no rodapé */}
        <View className="px-4 py-3 bg-background border-t border-border flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isLoading}
            className="flex-1 bg-surface rounded-lg py-3 border border-border"
          >
            <Text className="text-center font-semibold text-foreground">
              Cancelar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSalvar}
            disabled={isLoading}
            className="flex-1 bg-primary rounded-lg py-3"
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-center font-semibold text-white">
                Salvar
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
