import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { FilterCheckbox } from "@/components/filter-checkbox";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { generateReport, generateExcel } from "@/lib/report";

const FAIXAS_IDADE = [
  { label: "Sub-17", min: 0, max: 16 },
  { label: "Sub-20", min: 17, max: 19 },
  { label: "Sub-23", min: 20, max: 22 },
  { label: "21-25", min: 21, max: 25 },
  { label: "26+", min: 26, max: 100 },
];

export default function FiltrosScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  // Filtros
  const [selectedPosicoes, setSelectedPosicoes] = useState<string[]>([]);
  const [selectedClubes, setSelectedClubes] = useState<string[]>([]);
  const [selectedIdadeFaixas, setSelectedIdadeFaixas] = useState<number[]>([]);
  const [selectedNaturalidades, setSelectedNaturalidades] = useState<string[]>([]);
  
  // Seleção de atletas
  const [selectedAtletasIds, setSelectedAtletasIds] = useState<number[]>([]);

  // Query de atletas
  const { data: atletas = [], isLoading, refetch } = trpc.atletas.list.useQuery();

  // Extrair posições e clubes únicos
  const posicoes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a) => { if (a.posicao) set.add(a.posicao); });
    return Array.from(set).sort();
  }, [atletas]);

  const clubes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a) => { if (a.clube) set.add(a.clube); });
    return Array.from(set).sort();
  }, [atletas]);

  const naturalidades = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a) => { if (a.naturalidade) set.add(a.naturalidade); });
    return Array.from(set).sort();
  }, [atletas]);

  // Filtrar atletas
  const filteredAtletas = useMemo(() => {
    return atletas.filter((atleta) => {
      if (searchQuery && !atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedPosicoes.length > 0 && !selectedPosicoes.includes(atleta.posicao || "")) {
        return false;
      }
      if (selectedClubes.length > 0 && !selectedClubes.includes(atleta.clube || "")) {
        return false;
      }
      if (selectedIdadeFaixas.length > 0) {
        const idade = atleta.idade ?? 0;
        const matchesFaixa = selectedIdadeFaixas.some((faixaIdx) => {
          const faixa = FAIXAS_IDADE[faixaIdx];
          return idade >= faixa.min && idade <= faixa.max;
        });
        if (!matchesFaixa) return false;
      }
      if (selectedNaturalidades.length > 0 && !selectedNaturalidades.includes(atleta.naturalidade || "")) {
        return false;
      }
      return true;
    });
  }, [atletas, searchQuery, selectedPosicoes, selectedClubes, selectedIdadeFaixas, selectedNaturalidades]);


  const toggleAtletaSelection = (id: number) => {
    setSelectedAtletasIds((prev) =>
      prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    setSelectedAtletasIds(filteredAtletas.map((a) => a.id));
  };

  const deselectAll = () => {
    setSelectedAtletasIds([]);
  };

  const handleGenerateReport = async () => {
    if (selectedAtletasIds.length === 0) {
      Alert.alert("Aviso", "Marque pelo menos um atleta para gerar o relatório");
      return;
    }

    setGeneratingPdf(true);
    try {
      const filters = {
        posicao: selectedPosicoes.length > 0 ? selectedPosicoes.join(", ") : "Todas",
        faixaIdade: selectedIdadeFaixas.length > 0 ? selectedIdadeFaixas.map(i => FAIXAS_IDADE[i].label).join(", ") : "Todas",
        clube: selectedClubes.length > 0 ? selectedClubes.join(", ") : "Todos",
      };
      await generateReport(selectedAtletasIds, filters);
      Alert.alert("Sucesso", "Relatório gerado com sucesso!");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível gerar o relatório.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGenerateExcel = async () => {
    if (selectedAtletasIds.length === 0) {
      Alert.alert("Aviso", "Marque pelo menos um atleta para exportar");
      return;
    }

    setGeneratingExcel(true);
    try {
      const filters = {
        posicao: selectedPosicoes.length > 0 ? selectedPosicoes.join(", ") : "Todas",
        faixaIdade: selectedIdadeFaixas.length > 0 ? selectedIdadeFaixas.map(i => FAIXAS_IDADE[i].label).join(", ") : "Todas",
        clube: selectedClubes.length > 0 ? selectedClubes.join(", ") : "Todos",
      };
      await generateExcel(selectedAtletasIds, filters);
      Alert.alert("Sucesso", "Planilha exportada com sucesso!");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível exportar a planilha.");
    } finally {
      setGeneratingExcel(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "600", color: colors.foreground, marginLeft: 12 }}>
          Gerar Relatório
        </Text>
      </View>

      <FlatList
        data={filteredAtletas}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={{ padding: 16, gap: 12 }}>
            {/* Busca */}
            <TextInput
              placeholder="Buscar atleta..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                color: colors.foreground,
              }}
              placeholderTextColor={colors.muted}
            />

            {/* Filtros de Posição */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                POSIÇÕES
              </Text>
              <View>
                {posicoes.map((pos) => (
                  <FilterCheckbox
                    key={pos}
                    label={pos}
                    checked={selectedPosicoes.includes(pos)}
                    onPress={() =>
                      setSelectedPosicoes((prev) =>
                        prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
                      )
                    }
                  />
                ))}
              </View>
            </View>

            {/* Filtros de Clube */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                CLUBES
              </Text>
              <View>
                {clubes.map((clube) => (
                  <FilterCheckbox
                    key={clube}
                    label={clube}
                    checked={selectedClubes.includes(clube)}
                    onPress={() =>
                      setSelectedClubes((prev) =>
                        prev.includes(clube) ? prev.filter((c) => c !== clube) : [...prev, clube]
                      )
                    }
                  />
                ))}
              </View>
            </View>

            {/* Filtros de Idade */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                FAIXA DE IDADE
              </Text>
              <View>
                {FAIXAS_IDADE.map((faixa, idx) => (
                  <FilterCheckbox
                    key={idx}
                    label={faixa.label}
                    checked={selectedIdadeFaixas.includes(idx)}
                    onPress={() =>
                      setSelectedIdadeFaixas((prev) =>
                        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                      )
                    }
                  />
                ))}
              </View>
            </View>

            {/* Filtros de Naturalidade */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                NATURALIDADE (ESTADOS)
              </Text>
              <View>
                {naturalidades.map((naturalidade) => (
                  <FilterCheckbox
                    key={naturalidade}
                    label={naturalidade}
                    checked={selectedNaturalidades.includes(naturalidade)}
                    onPress={() =>
                      setSelectedNaturalidades((prev) =>
                        prev.includes(naturalidade) ? prev.filter((n) => n !== naturalidade) : [...prev, naturalidade]
                      )
                    }
                  />
                ))}
              </View>
            </View>

            {/* Botões de Seleção */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={selectAllFiltered}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ textAlign: "center", color: colors.foreground, fontWeight: "600", fontSize: 12 }}>
                  Selecionar Todos ({selectedAtletasIds.length}/{filteredAtletas.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={deselectAll}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ textAlign: "center", color: colors.foreground, fontWeight: "600", fontSize: 12 }}>
                  Desselecionar
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              Atletas ({filteredAtletas.length})
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = selectedAtletasIds.includes(item.id);
          return (
            <TouchableOpacity
              onPress={() => toggleAtletaSelection(item.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: isSelected ? colors.surface : colors.background,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary : "transparent",
                  marginRight: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected && <Text style={{ color: "white", fontWeight: "bold" }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: colors.foreground }}>{item.nome}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {item.posicao} • {item.clube} • {item.idade} anos
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <View style={{ padding: 16, gap: 8 }}>
            <TouchableOpacity
              onPress={handleGenerateReport}
              disabled={generatingPdf || selectedAtletasIds.length === 0}
              style={{
                backgroundColor: selectedAtletasIds.length > 0 ? colors.primary : colors.border,
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                {generatingPdf ? "Gerando..." : "Gerar Relatório PDF"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGenerateExcel}
              disabled={generatingExcel || selectedAtletasIds.length === 0}
              style={{
                backgroundColor: selectedAtletasIds.length > 0 ? colors.primary : colors.border,
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                {generatingExcel ? "Exportando..." : "Exportar Excel"}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </ScreenContainer>
  );
}
