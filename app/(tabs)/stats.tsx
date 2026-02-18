import React, { useMemo } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
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

export default function StatsScreen() {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;

  // Carregar atletas via tRPC
  const { data: atletas = [] } = trpc.atletas.list.useQuery();

  // Calcular estatísticas
  const stats = useMemo(() => {
    const newStats: Stats = {
      totalAtletas: atletas.length,
      posicoes: {},
      idades: {},
      escalas: {},
      clubes: {},
    };

    atletas.forEach((atleta: any) => {
      // Contar posições
      if (atleta.posicao) {
        newStats.posicoes[atleta.posicao] = (newStats.posicoes[atleta.posicao] || 0) + 1;
      }

      // Contar idades (em faixas)
      if (atleta.idade) {
        const faixa = Math.floor(atleta.idade / 5) * 5;
        const faixaLabel = `${faixa}-${faixa + 4}`;
        newStats.idades[faixaLabel] = (newStats.idades[faixaLabel] || 0) + 1;
      }

      // Contar escalas
      if (atleta.escala) {
        newStats.escalas[atleta.escala] = (newStats.escalas[atleta.escala] || 0) + 1;
      }

      // Contar clubes
      if (atleta.clube) {
        newStats.clubes[atleta.clube] = (newStats.clubes[atleta.clube] || 0) + 1;
      }
    });

    return newStats;
  }, [atletas]);

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>Estatísticas</Text>
      </View>

      {/* Cards de Resumo */}
      <View style={{ padding: 16, gap: 12 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>Total de Atletas</Text>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground, marginTop: 4 }}>
            {stats.totalAtletas}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: "#FF6B35",
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>Posições Diferentes</Text>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground, marginTop: 4 }}>
            {Object.keys(stats.posicoes).length}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: "#00BCD4",
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>Clubes Diferentes</Text>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground, marginTop: 4 }}>
            {Object.keys(stats.clubes).length}
          </Text>
        </View>
      </View>

      {/* Gráfico de Posições */}
      {posicoesPorcentagem.length > 0 && (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>
            Distribuição de Posições
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 8, alignItems: "center" }}>
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
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>
            Distribuição de Idades
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 8, overflow: "hidden" }}>
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
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>
          Posições
        </Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, overflow: "hidden" }}>
          {Object.entries(stats.posicoes)
            .sort((a, b) => b[1] - a[1])
            .map(([posicao, count], index) => (
              <View
                key={posicao}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  borderBottomWidth: index < Object.entries(stats.posicoes).length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "500" }}>{posicao}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      width: 100,
                      height: 8,
                      backgroundColor: colors.border,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${(count / stats.totalAtletas) * 100}%`,
                        height: "100%",
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 12, minWidth: 30, textAlign: "right" }}>
                    {count}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      </View>

      {/* Tabela de Escalas */}
      {Object.keys(stats.escalas).length > 0 && (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>
            Escalas
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, overflow: "hidden" }}>
            {Object.entries(stats.escalas)
              .sort((a, b) => b[1] - a[1])
              .map(([escala, count], index) => (
                <View
                  key={escala}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 12,
                    borderBottomWidth: index < Object.entries(stats.escalas).length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "500" }}>{escala}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{count}</Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Espaço em branco */}
      <View style={{ height: 40 }} />
    </ScrollView>
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
