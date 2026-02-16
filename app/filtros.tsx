import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function FiltrosScreen() {
  const router = useRouter();
  const colors = useColors();
  
  // Estados dos filtros
  const [posicao, setPosicao] = useState("");
  const [clube, setClube] = useState("");
  const [idadeMin, setIdadeMin] = useState("");
  const [idadeMax, setIdadeMax] = useState("");
  const [alturaMin, setAlturaMin] = useState("");
  const [alturaMax, setAlturaMax] = useState("");
  const [pe, setPe] = useState("");
  const [escala, setEscala] = useState("");
  const [valencia, setValencia] = useState("");
  
  const handleLimpar = () => {
    setPosicao("");
    setClube("");
    setIdadeMin("");
    setIdadeMax("");
    setAlturaMin("");
    setAlturaMax("");
    setPe("");
    setEscala("");
    setValencia("");
  };
  
  const handleAplicar = () => {
    // TODO: Implementar aplicação de filtros
    // Por enquanto, apenas volta para a tela anterior
    router.back();
  };
  
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
            <Text className="text-xl font-bold text-foreground">Filtros</Text>
          </View>
          
          <TouchableOpacity onPress={handleLimpar}>
            <Text className="text-primary font-medium">Limpar</Text>
          </TouchableOpacity>
        </View>
        
        {/* Formulário de Filtros */}
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Posição */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Posição
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Ex: Atacante"
              placeholderTextColor={colors.muted}
              value={posicao}
              onChangeText={setPosicao}
            />
          </View>
          
          {/* Clube */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Clube
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Ex: Flamengo"
              placeholderTextColor={colors.muted}
              value={clube}
              onChangeText={setClube}
            />
          </View>
          
          {/* Idade */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Idade
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextInput
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                  placeholder="Mínima"
                  placeholderTextColor={colors.muted}
                  value={idadeMin}
                  onChangeText={setIdadeMin}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <TextInput
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                  placeholder="Máxima"
                  placeholderTextColor={colors.muted}
                  value={idadeMax}
                  onChangeText={setIdadeMax}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
          
          {/* Altura */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Altura (cm)
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextInput
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                  placeholder="Mínima"
                  placeholderTextColor={colors.muted}
                  value={alturaMin}
                  onChangeText={setAlturaMin}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <TextInput
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                  placeholder="Máxima"
                  placeholderTextColor={colors.muted}
                  value={alturaMax}
                  onChangeText={setAlturaMax}
                  keyboardType="numeric"
                />
              </View>
            </View>
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
          
          {/* Escala */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Escala
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Ex: A"
              placeholderTextColor={colors.muted}
              value={escala}
              onChangeText={setEscala}
            />
          </View>
          
          {/* Valência */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-2">
              Valência
            </Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              placeholder="Ex: Velocidade"
              placeholderTextColor={colors.muted}
              value={valencia}
              onChangeText={setValencia}
            />
          </View>
          
          <View className="h-20" />
        </ScrollView>
        
        {/* Botão fixo no rodapé */}
        <View className="px-4 py-3 bg-background border-t border-border">
          <TouchableOpacity
            onPress={handleAplicar}
            className="bg-primary rounded-lg py-3"
          >
            <Text className="text-center font-semibold text-white">
              Aplicar Filtros
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
