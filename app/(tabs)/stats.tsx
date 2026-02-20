import { View, Text, ScrollView, Dimensions, TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { BarChart, PieChart } from "react-native-chart-kit";
import { useMemo, useState } from "react";

interface Atleta {
  id: number;
  nome: string;
  posicao?: string;
  segundaPosicao?: string;
  idade?: number;
  altura?: string;
  escala?: string;
  clube?: string;
  link?: string;
  valencia?: string;
}

interface Stats {
  totalAtletas: number;
  posicoes: Record<string, number>;
  idades: Record<string, number>;
  escalas: Record<string, number>;
  clubes: Record<string, number>;
  idadeMedia: number;
  idadeMediana: number;
  alturaMedia: number;
  alturaMediana: number;
  idadeMin: number;
  idadeMax: number;
  alturaMin: number;
  alturaMax: number;
}

interface Filtros {
  posicoes: string[];
  escalas: string[];
  clubes: string[];
  idades: number[];
}

export default function StatsScreen() {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;

  const [filtros, setFiltros] = useState<Filtros>({
    posicoes: [],
    escalas: [],
    clubes: [],
    idades: [],
  });
  const [atletasSelecionados, setAtletasSelecionados] = useState<number[]>([]);
  const [showFiltros, setShowFiltros] = useState(false);
  const [showSelecao, setShowSelecao] = useState(false);
  const [showTabela, setShowTabela] = useState(false);
  const [abaFiltros, setAbaFiltros] = useState<"posicao" | "idade" | "clube" | "escala">("posicao");

  const { data: atletas = [] } = trpc.atletas.list.useQuery();

  const atletasFiltrados = useMemo(() => {
    return atletas.filter((atleta: any) => {
      if (filtros.posicoes.length > 0 && !filtros.posicoes.includes(atleta.posicao)) {
        return false;
      }
      if (filtros.escalas.length > 0 && !filtros.escalas.includes(atleta.escala)) {
        return false;
      }
      if (filtros.clubes.length > 0 && !filtros.clubes.includes(atleta.clube)) {
        return false;
      }
      if (filtros.idades.length > 0 && atleta.idade) {
        const faixa = Math.floor(atleta.idade / 5) * 5;
        if (!filtros.idades.includes(faixa)) {
          return false;
        }
      }
      return true;
    });
  }, [atletas, filtros]);

  const stats = useMemo(() => {
    const atletasParaAnalise = atletasSelecionados.length > 0
      ? atletasFiltrados.filter((a: any) => atletasSelecionados.includes(a.id))
      : atletasFiltrados;

    if (atletasParaAnalise.length === 0) {
      return {
        totalAtletas: 0,
        posicoes: {},
        idades: {},
        escalas: {},
        clubes: {},
        idadeMedia: 0,
        idadeMediana: 0,
        alturaMedia: 0,
        alturaMediana: 0,
        idadeMin: 0,
        idadeMax: 0,
        alturaMin: 0,
        alturaMax: 0,
      };
    }

    const posicoes: Record<string, number> = {};
    const idades: Record<string, number> = {};
    const escalas: Record<string, number> = {};
    const clubes: Record<string, number> = {};
    const idadesArray: number[] = [];
    const alturasArray: number[] = [];

    atletasParaAnalise.forEach((atleta: any) => {
      if (atleta.posicao) posicoes[atleta.posicao] = (posicoes[atleta.posicao] || 0) + 1;
      if (atleta.escala) escalas[atleta.escala] = (escalas[atleta.escala] || 0) + 1;
      if (atleta.clube) clubes[atleta.clube] = (clubes[atleta.clube] || 0) + 1;
      if (atleta.idade) {
        idadesArray.push(atleta.idade);
        const faixa = Math.floor(atleta.idade / 5) * 5;
        const label = `${faixa}-${faixa + 4}`;
        idades[label] = (idades[label] || 0) + 1;
      }
      if (atleta.altura) {
        const altura = parseFloat(atleta.altura);
        if (!isNaN(altura)) alturasArray.push(altura);
      }
    });

    const calcularMediana = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    return {
      totalAtletas: atletasParaAnalise.length,
      posicoes,
      idades,
      escalas,
      clubes,
      idadeMedia: idadesArray.length > 0 ? Math.round(idadesArray.reduce((a, b) => a + b, 0) / idadesArray.length * 10) / 10 : 0,
      idadeMediana: calcularMediana(idadesArray),
      alturaMedia: alturasArray.length > 0 ? (alturasArray.reduce((a, b) => a + b, 0) / alturasArray.length).toFixed(2) : "0",
      alturaMediana: calcularMediana(alturasArray).toFixed(2),
      idadeMin: idadesArray.length > 0 ? Math.min(...idadesArray) : 0,
      idadeMax: idadesArray.length > 0 ? Math.max(...idadesArray) : 0,
      alturaMin: alturasArray.length > 0 ? Math.min(...alturasArray).toFixed(2) : "0",
      alturaMax: alturasArray.length > 0 ? Math.max(...alturasArray).toFixed(2) : "0",
    };
  }, [atletasFiltrados, atletasSelecionados]);

  const posicoes = useMemo(() => [...new Set(atletas.map((a: any) => a.posicao).filter(Boolean))], [atletas]);
  const clubes = useMemo(() => [...new Set(atletas.map((a: any) => a.clube).filter(Boolean))], [atletas]);
  const escalas = useMemo(() => [...new Set(atletas.map((a: any) => a.escala).filter(Boolean))], [atletas]);

  const posicoesPorcentagem = useMemo(() => {
    return Object.entries(stats.posicoes).map(([name, value]) => ({
      name,
      population: value,
      color: colors.primary,
      legendFontColor: colors.foreground,
    }));
  }, [stats.posicoes, colors]);

  const idadesPorcentagem = useMemo(() => {
    return Object.entries(stats.idades).map(([name, value]) => ({
      name,
      population: value,
    }));
  }, [stats.idades]);

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: () => colors.primary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  const gerarPDFMutation = trpc.relatorios.gerarPDF.useMutation();

  const handleGerarRelatorio = async () => {
    try {
      const atletasParaRelatorio = atletasSelecionados.length > 0
        ? atletasFiltrados.filter((a: any) => atletasSelecionados.includes(a.id))
        : atletasFiltrados;

      const resultado = await gerarPDFMutation.mutateAsync({
        titulo: `Relatório de Atletas - ${new Date().toLocaleDateString("pt-BR")}`,
        posicoes: filtros.posicoes,
        idades: filtros.idades,
        clubes: filtros.clubes,
        atletaIds: atletasParaRelatorio.map((a: any) => a.id),
      });

      if (resultado.success && resultado.pdfBase64) {
        const binaryString = atob(resultado.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `Relatorio_Atletas_${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert("Relatório baixado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar relatório");
    }
  };

  const handleLimparFiltros = () => {
    setFiltros({
      posicoes: [],
      escalas: [],
      clubes: [],
      idades: [],
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.foreground,
    },
    filterButton: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 12,
    },
    tagsContainer: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    tag: {
      backgroundColor: colors.primary + "33",
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    tagText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "600",
    },
    resumo: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
    },
    resumoText: {
      color: colors.foreground,
      fontWeight: "600",
    },
    actionButtons: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    actionButtonSecondary: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      color: colors.background,
      fontWeight: "600",
    },
    actionButtonTextSecondary: {
      color: colors.foreground,
      fontWeight: "600",
    },
    statsSection: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    statsSectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.foreground,
      marginBottom: 12,
    },
    statsCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: "hidden",
    },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statRowLast: {
      borderBottomWidth: 0,
    },
    statLabel: {
      color: colors.foreground,
      fontWeight: "500",
    },
    statValue: {
      color: colors.primary,
      fontWeight: "bold",
    },
    chartContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      overflow: "hidden",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      flex: 1,
      backgroundColor: colors.background,
      marginTop: 48,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.foreground,
    },
    tabsContainer: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontWeight: "600",
      fontSize: 14,
      color: colors.muted,
      textTransform: "capitalize",
    },
    tabTextActive: {
      color: colors.primary,
    },
    modalScroll: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    filterItem: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterItemActive: {
      backgroundColor: colors.primary + "33",
      borderColor: colors.primary,
    },
    filterItemText: {
      fontWeight: "500",
      color: colors.foreground,
    },
    filterItemTextActive: {
      color: colors.primary,
    },
    modalFooter: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    listItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
      borderColor: colors.border,
    },
    checkboxActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxText: {
      color: colors.background,
      fontWeight: "bold",
      fontSize: 12,
    },
    listItemContent: {
      flex: 1,
    },
    listItemName: {
      color: colors.foreground,
      fontWeight: "600",
    },
    listItemSubtitle: {
      color: colors.muted,
      fontSize: 12,
    },
    tableItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableItemName: {
      color: colors.foreground,
      fontWeight: "600",
    },
    tableTags: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
      flexWrap: "wrap",
    },
    tableTag: {
      backgroundColor: colors.surface,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    tableTagText: {
      color: colors.muted,
      fontSize: 12,
    },
    tableItemNote: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 8,
      fontStyle: "italic",
    },
  });

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header com Botão de Filtro */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estatísticas</Text>
          <TouchableOpacity
            onPress={() => setShowFiltros(true)}
            style={styles.filterButton}
          >
            <IconSymbol name="line.horizontal.3" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Filtros Ativos */}
        {(filtros.posicoes.length > 0 || filtros.idades.length > 0 || filtros.clubes.length > 0 || filtros.escalas.length > 0) && (
          <View style={styles.tagsContainer}>
            <View style={styles.tagsRow}>
              {filtros.posicoes.map((p) => (
                <View key={p} style={styles.tag}>
                  <Text style={styles.tagText}>{p}</Text>
                  <TouchableOpacity onPress={() => setFiltros({ ...filtros, posicoes: filtros.posicoes.filter((x) => x !== p) })}>
                    <IconSymbol name="xmark" size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
              {filtros.idades.map((i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{i}-{i + 4}</Text>
                  <TouchableOpacity onPress={() => setFiltros({ ...filtros, idades: filtros.idades.filter((x) => x !== i) })}>
                    <IconSymbol name="xmark" size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
              {filtros.clubes.map((c) => (
                <View key={c} style={styles.tag}>
                  <Text style={styles.tagText}>{c}</Text>
                  <TouchableOpacity onPress={() => setFiltros({ ...filtros, clubes: filtros.clubes.filter((x) => x !== c) })}>
                    <IconSymbol name="xmark" size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resumo */}
        <View style={styles.resumo}>
          <Text style={styles.resumoText}>
            {atletasSelecionados.length > 0 ? atletasSelecionados.length : atletasFiltrados.length} atleta(s) selecionado(s)
          </Text>
        </View>

        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => setShowSelecao(true)}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Selecionar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowTabela(true)}
            style={styles.actionButtonSecondary}
          >
            <Text style={styles.actionButtonTextSecondary}>Tabela</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGerarRelatorio}
            style={styles.actionButtonSecondary}
          >
            <Text style={styles.actionButtonTextSecondary}>Relatório</Text>
          </TouchableOpacity>
        </View>

        {/* Estatísticas */}
        {stats.totalAtletas > 0 && (
          <>
            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>Estatísticas de Idade</Text>
              <View style={styles.statsCard}>
                <View style={[styles.statRow]}>
                  <Text style={styles.statLabel}>Média</Text>
                  <Text style={styles.statValue}>{stats.idadeMedia} anos</Text>
                </View>
                <View style={[styles.statRow]}>
                  <Text style={styles.statLabel}>Mediana</Text>
                  <Text style={styles.statValue}>{stats.idadeMediana} anos</Text>
                </View>
                <View style={[styles.statRow]}>
                  <Text style={styles.statLabel}>Mínima</Text>
                  <Text style={styles.statValue}>{stats.idadeMin} anos</Text>
                </View>
                <View style={[styles.statRow, styles.statRowLast]}>
                  <Text style={styles.statLabel}>Máxima</Text>
                  <Text style={styles.statValue}>{stats.idadeMax} anos</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>Estatísticas de Altura</Text>
              <View style={styles.statsCard}>
                <View style={[styles.statRow]}>
                  <Text style={styles.statLabel}>Média</Text>
                  <Text style={styles.statValue}>{stats.alturaMedia} m</Text>
                </View>
                <View style={[styles.statRow]}>
                  <Text style={styles.statLabel}>Mediana</Text>
                  <Text style={styles.statValue}>{stats.alturaMediana} m</Text>
                </View>
                <View style={[styles.statRow]}>
                  <Text style={styles.statLabel}>Mínima</Text>
                  <Text style={styles.statValue}>{stats.alturaMin} m</Text>
                </View>
                <View style={[styles.statRow, styles.statRowLast]}>
                  <Text style={styles.statLabel}>Máxima</Text>
                  <Text style={styles.statValue}>{stats.alturaMax} m</Text>
                </View>
              </View>
            </View>

            {posicoesPorcentagem.length > 0 && (
              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>Distribuição de Posições</Text>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={posicoesPorcentagem}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              </View>
            )}

            {idadesPorcentagem.length > 0 && (
              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>Distribuição de Idades</Text>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={{
                      labels: idadesPorcentagem.map((item) => item.name),
                      datasets: [
                        {
                          data: idadesPorcentagem.map((item) => item.population),
                        },
                      ],
                    }}
                    width={screenWidth - 60}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    verticalLabelRotation={45}
                  />
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal de Filtros com Abas */}
      <Modal visible={showFiltros} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowFiltros(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Abas */}
            <View style={styles.tabsContainer}>
              {(["posicao", "idade", "clube", "escala"] as const).map((aba) => (
                <TouchableOpacity
                  key={aba}
                  onPress={() => setAbaFiltros(aba)}
                  style={[styles.tab, abaFiltros === aba && styles.tabActive]}
                >
                  <Text style={[styles.tabText, abaFiltros === aba && styles.tabTextActive]}>
                    {aba === "posicao" ? "Posição" : aba === "idade" ? "Idade" : aba === "clube" ? "Clube" : "Escala"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conteúdo das Abas */}
            <ScrollView style={styles.modalScroll}>
              {abaFiltros === "posicao" && (
                <View>
                  {posicoes.map((pos) => (
                    <TouchableOpacity
                      key={pos}
                      onPress={() => {
                        setFiltros({
                          ...filtros,
                          posicoes: filtros.posicoes.includes(pos)
                            ? filtros.posicoes.filter((p) => p !== pos)
                            : [...filtros.posicoes, pos],
                        });
                      }}
                      style={[styles.filterItem, filtros.posicoes.includes(pos) && styles.filterItemActive]}
                    >
                      <Text style={[styles.filterItemText, filtros.posicoes.includes(pos) && styles.filterItemTextActive]}>
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {abaFiltros === "idade" && (
                <View>
                  {[15, 20, 25, 30, 35, 40].map((idade) => (
                    <TouchableOpacity
                      key={idade}
                      onPress={() => {
                        setFiltros({
                          ...filtros,
                          idades: filtros.idades.includes(idade)
                            ? filtros.idades.filter((i) => i !== idade)
                            : [...filtros.idades, idade],
                        });
                      }}
                      style={[styles.filterItem, filtros.idades.includes(idade) && styles.filterItemActive]}
                    >
                      <Text style={[styles.filterItemText, filtros.idades.includes(idade) && styles.filterItemTextActive]}>
                        {idade}-{idade + 4} anos
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {abaFiltros === "clube" && (
                <View>
                  {clubes.map((clube) => (
                    <TouchableOpacity
                      key={clube}
                      onPress={() => {
                        setFiltros({
                          ...filtros,
                          clubes: filtros.clubes.includes(clube)
                            ? filtros.clubes.filter((c) => c !== clube)
                            : [...filtros.clubes, clube],
                        });
                      }}
                      style={[styles.filterItem, filtros.clubes.includes(clube) && styles.filterItemActive]}
                    >
                      <Text style={[styles.filterItemText, filtros.clubes.includes(clube) && styles.filterItemTextActive]}>
                        {clube}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {abaFiltros === "escala" && (
                <View>
                  {escalas.map((escala) => (
                    <TouchableOpacity
                      key={escala}
                      onPress={() => {
                        setFiltros({
                          ...filtros,
                          escalas: filtros.escalas.includes(escala)
                            ? filtros.escalas.filter((e) => e !== escala)
                            : [...filtros.escalas, escala],
                        });
                      }}
                      style={[styles.filterItem, filtros.escalas.includes(escala) && styles.filterItemActive]}
                    >
                      <Text style={[styles.filterItemText, filtros.escalas.includes(escala) && styles.filterItemTextActive]}>
                        {escala}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Botões de Ação */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleLimparFiltros}
                style={styles.actionButtonSecondary}
              >
                <Text style={styles.actionButtonTextSecondary}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFiltros(false)}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Atletas */}
      <Modal visible={showSelecao} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Atletas</Text>
              <TouchableOpacity onPress={() => setShowSelecao(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={atletasFiltrados}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setAtletasSelecionados(
                      atletasSelecionados.includes(item.id)
                        ? atletasSelecionados.filter((id) => id !== item.id)
                        : [...atletasSelecionados, item.id]
                    );
                  }}
                  style={[
                    styles.listItem,
                    atletasSelecionados.includes(item.id) && { backgroundColor: colors.primary + "10" }
                  ]}
                >
                  <View style={[
                    styles.checkbox,
                    atletasSelecionados.includes(item.id) && styles.checkboxActive
                  ]}>
                    {atletasSelecionados.includes(item.id) && (
                      <Text style={styles.checkboxText}>✓</Text>
                    )}
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemName}>{item.nome}</Text>
                    <Text style={styles.listItemSubtitle}>{item.posicao} • {item.idade} anos</Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setAtletasSelecionados([])}
                style={styles.actionButtonSecondary}
              >
                <Text style={styles.actionButtonTextSecondary}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowSelecao(false)}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Tabela */}
      <Modal visible={showTabela} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comparativo de Atletas</Text>
              <TouchableOpacity onPress={() => setShowTabela(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={atletasSelecionados.length > 0 ? atletasFiltrados.filter((a: any) => atletasSelecionados.includes(a.id)) : atletasFiltrados}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.tableItem}>
                  <Text style={styles.tableItemName}>{item.nome}</Text>
                  <View style={styles.tableTags}>
                    <View style={styles.tableTag}>
                      <Text style={styles.tableTagText}>{item.posicao}</Text>
                    </View>
                    <View style={styles.tableTag}>
                      <Text style={styles.tableTagText}>{item.idade} anos</Text>
                    </View>
                    <View style={styles.tableTag}>
                      <Text style={styles.tableTagText}>{item.altura}m</Text>
                    </View>
                    {item.segundaPosicao && (
                      <View style={styles.tableTag}>
                        <Text style={styles.tableTagText}>{item.segundaPosicao}</Text>
                      </View>
                    )}
                  </View>
                  {item.valencia && (
                    <Text style={styles.tableItemNote}>{item.valencia}</Text>
                  )}
                </View>
              )}
            />

            <TouchableOpacity
              onPress={() => setShowTabela(false)}
              style={[styles.actionButton, { margin: 16 }]}
            >
              <Text style={styles.actionButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
