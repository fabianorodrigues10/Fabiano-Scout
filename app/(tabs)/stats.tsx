"use client";

import { useState, useMemo } from "react";
import { View, Text, ScrollView, Dimensions, TouchableOpacity, Modal, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { BarChart, PieChart } from "react-native-chart-kit";

interface Atleta {
  id: number;
  nome: string;
  posicao?: string;
  segundaPosicao?: string;
  idade?: number;
  altura?: number;
  escala?: string;
  clube?: string;
}

interface Stats {
  totalAtletas: number;
  posicoes: Record<string, number>;
  idades: Record<string, number>;
  escalas: Record<string, number>;
  clubes: Record<string, number>;
}

interface Filtros {
  posicoes: string[];
  escalas: string[];
  clubes: string[];
  idadeMin: number;
  idadeMax: number;
}

export default function StatsScreen() {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;

  // Estados
  const [filtros, setFiltros] = useState<Filtros>({
    posicoes: [],
    escalas: [],
    clubes: [],
    idadeMin: 0,
    idadeMax: 100,
  });
  const [atletasSelecionados, setAtletasSelecionados] = useState<number[]>([]);
  const [showFiltros, setShowFiltros] = useState(false);
  const [showSelecao, setShowSelecao] = useState(false);

  // Carregar atletas via tRPC
  const { data: atletas = [] } = trpc.atletas.list.useQuery();

  // Aplicar filtros
  const atletasFiltrados = useMemo(() => {
    return atletas.filter((atleta: any) => {
      // Filtro de posição
      if (filtros.posicoes.length > 0 && !filtros.posicoes.includes(atleta.posicao)) {
        return false;
      }

      // Filtro de escala
      if (filtros.escalas.length > 0 && !filtros.escalas.includes(atleta.escala)) {
        return false;
      }

      // Filtro de clube
      if (filtros.clubes.length > 0 && !filtros.clubes.includes(atleta.clube)) {
        return false;
      }

      // Filtro de idade
      if (atleta.idade && (atleta.idade < filtros.idadeMin || atleta.idade > filtros.idadeMax)) {
        return false;
      }

      return true;
    });
  }, [atletas, filtros]);

  // Calcular estatísticas dos atletas filtrados
  const stats = useMemo(() => {
    const atletasParaAnalise = atletasSelecionados.length > 0
      ? atletasFiltrados.filter((a: any) => atletasSelecionados.includes(a.id))
      : atletasFiltrados;

    const newStats: Stats = {
      totalAtletas: atletasParaAnalise.length,
      posicoes: {},
      idades: {},
      escalas: {},
      clubes: {},
    };

    atletasParaAnalise.forEach((atleta: any) => {
      if (atleta.posicao) {
        newStats.posicoes[atleta.posicao] = (newStats.posicoes[atleta.posicao] || 0) + 1;
      }

      if (atleta.idade) {
        const faixa = Math.floor(atleta.idade / 5) * 5;
        const faixaLabel = `${faixa}-${faixa + 4}`;
        newStats.idades[faixaLabel] = (newStats.idades[faixaLabel] || 0) + 1;
      }

      if (atleta.escala) {
        newStats.escalas[atleta.escala] = (newStats.escalas[atleta.escala] || 0) + 1;
      }

      if (atleta.clube) {
        newStats.clubes[atleta.clube] = (newStats.clubes[atleta.clube] || 0) + 1;
      }
    });

    return newStats;
  }, [atletasFiltrados, atletasSelecionados]);

  // Extrair opções únicas para filtros
  const posicoes = [...new Set(atletas.map((a: any) => a.posicao).filter(Boolean))].sort();
  const escalas = [...new Set(atletas.map((a: any) => a.escala).filter(Boolean))].sort();
  const clubes = [...new Set(atletas.map((a: any) => a.clube).filter(Boolean))].sort();

  const posicoesPorcentagem = Object.entries(stats.posicoes).map(([pos, count]) => ({
    name: pos,
    population: count,
    color: getColorForPosition(pos),
    legendFontColor: colors.foreground,
    legendFontSize: 12,
  }));

  const idadesPorcentagem = Object.entries(stats.idades)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([faixa, count]) => ({
      name: faixa,
      population: count,
      color: colors.primary,
      legendFontColor: colors.foreground,
      legendFontSize: 12,
    }));

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: () => colors.primary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  const handleGerarRelatorio = () => {
    // TODO: Implementar geração de PDF
    alert("Relatório em PDF será gerado em breve!");
  };

  const handleLimparFiltros = () => {
    setFiltros({
      posicoes: [],
      escalas: [],
      clubes: [],
      idadeMin: 0,
      idadeMax: 100,
    });
    setAtletasSelecionados([]);
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-2xl font-bold text-foreground">Estatísticas</Text>
          <Text className="text-sm text-muted mt-1">
            {stats.totalAtletas} atleta{stats.totalAtletas !== 1 ? "s" : ""} analisado{stats.totalAtletas !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Botões de Ação */}
        <View className="px-4 py-4 gap-2 flex-row">
          <TouchableOpacity
            onPress={() => setShowFiltros(true)}
            className="flex-1 bg-primary rounded-lg py-3 flex-row items-center justify-center gap-2"
          >
            <IconSymbol name="slider.horizontal.3" size={18} color="white" />
            <Text className="text-white font-semibold">Filtros</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSelecao(true)}
            className="flex-1 bg-primary rounded-lg py-3 flex-row items-center justify-center gap-2"
          >
            <IconSymbol name="checkmark.circle" size={18} color="white" />
            <Text className="text-white font-semibold">Selecionar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGerarRelatorio}
            className="flex-1 bg-primary rounded-lg py-3 flex-row items-center justify-center gap-2"
          >
            <IconSymbol name="document.fill" size={18} color="white" />
            <Text className="text-white font-semibold">Relatório</Text>
          </TouchableOpacity>
        </View>

        {/* Tags de Filtros Ativos */}
        {(filtros.posicoes.length > 0 || filtros.escalas.length > 0 || filtros.clubes.length > 0 || atletasSelecionados.length > 0) && (
          <View className="px-4 py-2 gap-2">
            <View className="flex-row flex-wrap gap-2">
              {filtros.posicoes.map((pos) => (
                <View key={pos} className="bg-primary/20 rounded-full px-3 py-1 flex-row items-center gap-2">
                  <Text className="text-xs text-primary font-semibold">{pos}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFiltros({
                        ...filtros,
                        posicoes: filtros.posicoes.filter((p) => p !== pos),
                      })
                    }
                  >
                    <Text className="text-primary font-bold">×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {filtros.escalas.map((esc) => (
                <View key={esc} className="bg-primary/20 rounded-full px-3 py-1 flex-row items-center gap-2">
                  <Text className="text-xs text-primary font-semibold">{esc}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFiltros({
                        ...filtros,
                        escalas: filtros.escalas.filter((e) => e !== esc),
                      })
                    }
                  >
                    <Text className="text-primary font-bold">×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {atletasSelecionados.length > 0 && (
                <View className="bg-primary/20 rounded-full px-3 py-1">
                  <Text className="text-xs text-primary font-semibold">{atletasSelecionados.length} selecionados</Text>
                </View>
              )}
            </View>
            {(filtros.posicoes.length > 0 || filtros.escalas.length > 0 || atletasSelecionados.length > 0) && (
              <TouchableOpacity onPress={handleLimparFiltros}>
                <Text className="text-xs text-primary font-semibold">Limpar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Cards de Resumo */}
        <View className="px-4 py-4 gap-3">
          <View className="bg-surface rounded-xl p-4 border-l-4 border-primary">
            <Text className="text-xs text-muted font-semibold">Total de Atletas</Text>
            <Text className="text-3xl font-bold text-foreground mt-2">{stats.totalAtletas}</Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-xl p-4 border-l-4 border-orange-500">
              <Text className="text-xs text-muted font-semibold">Posições</Text>
              <Text className="text-2xl font-bold text-foreground mt-2">
                {Object.keys(stats.posicoes).length}
              </Text>
            </View>

            <View className="flex-1 bg-surface rounded-xl p-4 border-l-4 border-cyan-500">
              <Text className="text-xs text-muted font-semibold">Clubes</Text>
              <Text className="text-2xl font-bold text-foreground mt-2">
                {Object.keys(stats.clubes).length}
              </Text>
            </View>
          </View>
        </View>

        {/* Gráfico de Posições */}
        {posicoesPorcentagem.length > 0 && (
          <View className="px-4 py-4">
            <Text className="text-base font-bold text-foreground mb-3">Distribuição de Posições</Text>
            <View className="bg-surface rounded-xl p-3 items-center overflow-hidden">
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

        {/* Gráfico de Idades */}
        {idadesPorcentagem.length > 0 && (
          <View className="px-4 py-4">
            <Text className="text-base font-bold text-foreground mb-3">Distribuição de Idades</Text>
            <View className="bg-surface rounded-xl p-3 overflow-hidden">
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

        {/* Tabela de Posições */}
        <View className="px-4 py-4">
          <Text className="text-base font-bold text-foreground mb-3">Posições</Text>
          <View className="bg-surface rounded-xl overflow-hidden">
            {Object.entries(stats.posicoes)
              .sort((a, b) => b[1] - a[1])
              .map(([posicao, count], index) => (
                <View
                  key={posicao}
                  className={`flex-row justify-between items-center px-4 py-3 ${
                    index < Object.entries(stats.posicoes).length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <Text className="text-foreground font-medium">{posicao}</Text>
                  <View className="flex-row items-center gap-2">
                    <View className="w-24 h-2 bg-border rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary"
                        style={{ width: `${(count / stats.totalAtletas) * 100}%` }}
                      />
                    </View>
                    <Text className="text-muted text-xs w-8 text-right">{count}</Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        {/* Tabela de Escalas */}
        {Object.keys(stats.escalas).length > 0 && (
          <View className="px-4 py-4">
            <Text className="text-base font-bold text-foreground mb-3">Escalas</Text>
            <View className="bg-surface rounded-xl overflow-hidden">
              {Object.entries(stats.escalas)
                .sort((a, b) => b[1] - a[1])
                .map(([escala, count], index) => (
                  <View
                    key={escala}
                    className={`flex-row justify-between items-center px-4 py-3 ${
                      index < Object.entries(stats.escalas).length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <Text className="text-foreground font-medium">{escala}</Text>
                    <Text className="text-muted text-sm">{count}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Modal de Filtros */}
      <Modal visible={showFiltros} animationType="slide" transparent>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-background mt-12 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">Filtros</Text>
              <TouchableOpacity onPress={() => setShowFiltros(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-4">
              {/* Filtro de Posição */}
              <View className="mb-6">
                <Text className="text-base font-bold text-foreground mb-3">Posição</Text>
                <View className="gap-2">
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
                      className={`p-3 rounded-lg border ${
                        filtros.posicoes.includes(pos)
                          ? "bg-primary/20 border-primary"
                          : "bg-surface border-border"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          filtros.posicoes.includes(pos) ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Filtro de Escala */}
              <View className="mb-6">
                <Text className="text-base font-bold text-foreground mb-3">Escala</Text>
                <View className="gap-2">
                  {escalas.map((esc) => (
                    <TouchableOpacity
                      key={esc}
                      onPress={() => {
                        setFiltros({
                          ...filtros,
                          escalas: filtros.escalas.includes(esc)
                            ? filtros.escalas.filter((e) => e !== esc)
                            : [...filtros.escalas, esc],
                        });
                      }}
                      className={`p-3 rounded-lg border ${
                        filtros.escalas.includes(esc)
                          ? "bg-primary/20 border-primary"
                          : "bg-surface border-border"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          filtros.escalas.includes(esc) ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {esc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Botão Aplicar */}
              <TouchableOpacity
                onPress={() => setShowFiltros(false)}
                className="bg-primary rounded-lg py-3 items-center mb-4"
              >
                <Text className="text-white font-bold">Aplicar Filtros</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Atletas */}
      <Modal visible={showSelecao} animationType="slide" transparent>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-background mt-12 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">
                Selecionar Atletas ({atletasSelecionados.length})
              </Text>
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
                  className="flex-row items-center px-4 py-3 border-b border-border"
                >
                  <View
                    className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 ${
                      atletasSelecionados.includes(item.id)
                        ? "bg-primary border-primary"
                        : "border-border"
                    }`}
                  >
                    {atletasSelecionados.includes(item.id) && (
                      <IconSymbol name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">{item.nome}</Text>
                    <Text className="text-muted text-xs mt-1">{item.posicao}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-8">
                  <Text className="text-muted">Nenhum atleta encontrado</Text>
                </View>
              }
            />

            {/* Botão Aplicar */}
            <View className="px-4 py-4 border-t border-border">
              <TouchableOpacity
                onPress={() => setShowSelecao(false)}
                className="bg-primary rounded-lg py-3 items-center"
              >
                <Text className="text-white font-bold">Aplicar Seleção</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function getColorForPosition(posicao: string): string {
  const colors: Record<string, string> = {
    Goleiro: "#FF6B35",
    Lateral: "#FF1744",
    Zagueiro: "#00BCD4",
    Volante: "#4CAF50",
    Meia: "#9C27B0",
    Extremo: "#FFC107",
    Centroavante: "#F44336",
    "2º Atacante": "#FF9800",
  };
  return colors[posicao] || "#999999";
}
