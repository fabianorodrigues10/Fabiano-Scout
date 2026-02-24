"use client";

import { View, Text, ScrollView, Dimensions, TouchableOpacity, Modal, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { BarChart, PieChart } from "react-native-chart-kit";
import { useMemo, useState } from "react";
import { FilterDropdown } from "@/components/filter-dropdown";

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
  naturalidades: string[];
}

export default function StatsScreen() {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;

  const [filtros, setFiltros] = useState<Filtros>({
    posicoes: [],
    escalas: [],
    clubes: [],
    idades: [],
    naturalidades: [],
  });
  const [atletasSelecionados, setAtletasSelecionados] = useState<number[]>([]);
  const [showFiltros, setShowFiltros] = useState(false);
  const [showSelecao, setShowSelecao] = useState(false);
  const [showTabela, setShowTabela] = useState(false);
  const [abaFiltros, setAbaFiltros] = useState<"posicao" | "idade" | "clube" | "escala" | "naturalidade">("posicao");

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
      if (filtros.naturalidades.length > 0 && !filtros.naturalidades.includes(atleta.naturalidade)) {
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
  const naturalidades = useMemo(() => [...new Set(atletas.map((a: any) => a.naturalidade).filter(Boolean))], [atletas]);

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
        // Converter Base64 para Blob
        const binaryString = atob(resultado.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        
        // Criar URL do blob
        const url = URL.createObjectURL(blob);
        
        // Criar link de download
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
      naturalidades: [],
    });
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header com Botão de Filtro */}
        <View className="flex-row justify-between items-center px-4 py-4">
          <Text className="text-2xl font-bold text-foreground">Estatísticas</Text>
          <TouchableOpacity
            onPress={() => setShowFiltros(true)}
            className="bg-primary rounded-full p-3"
          >
            <IconSymbol name="line.horizontal.3" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Filtros Ativos */}
        {(filtros.posicoes.length > 0 || filtros.idades.length > 0 || filtros.clubes.length > 0 || filtros.escalas.length > 0) && (
          <View className="px-4 mb-4">
            <View className="flex-row flex-wrap gap-2">
              {filtros.posicoes.map((p) => (
                <View key={p} className="bg-primary/20 rounded-full px-3 py-1 flex-row items-center gap-2">
                  <Text className="text-primary text-xs font-semibold">{p}</Text>
                  <TouchableOpacity onPress={() => setFiltros({ ...filtros, posicoes: filtros.posicoes.filter((x) => x !== p) })}>
                    <IconSymbol name="xmark" size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
              {filtros.idades.map((i) => (
                <View key={i} className="bg-primary/20 rounded-full px-3 py-1 flex-row items-center gap-2">
                  <Text className="text-primary text-xs font-semibold">{i}-{i + 4}</Text>
                  <TouchableOpacity onPress={() => setFiltros({ ...filtros, idades: filtros.idades.filter((x) => x !== i) })}>
                    <IconSymbol name="xmark" size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
              {filtros.clubes.map((c) => (
                <View key={c} className="bg-primary/20 rounded-full px-3 py-1 flex-row items-center gap-2">
                  <Text className="text-primary text-xs font-semibold">{c}</Text>
                  <TouchableOpacity onPress={() => setFiltros({ ...filtros, clubes: filtros.clubes.filter((x) => x !== c) })}>
                    <IconSymbol name="xmark" size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resumo */}
        <View className="px-4 py-3 bg-surface mx-4 rounded-xl mb-4">
          <Text className="text-foreground font-semibold">
            {atletasSelecionados.length > 0 ? atletasSelecionados.length : atletasFiltrados.length} atleta(s) selecionado(s)
          </Text>
        </View>

        {/* Botões de Ação */}
        <View className="flex-row gap-3 px-4 mb-4">
          <TouchableOpacity
            onPress={() => setShowSelecao(true)}
            className="flex-1 bg-primary rounded-lg py-3 items-center"
          >
            <Text className="text-background font-semibold">Selecionar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowTabela(true)}
            className="flex-1 bg-surface border border-border rounded-lg py-3 items-center"
          >
            <Text className="text-foreground font-semibold">Tabela</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGerarRelatorio}
            className="flex-1 bg-surface border border-border rounded-lg py-3 items-center"
          >
            <Text className="text-foreground font-semibold">Relatório</Text>
          </TouchableOpacity>
        </View>

        {/* Estatísticas */}
        {stats.totalAtletas > 0 && (
          <>
            <View className="px-4 py-4">
              <Text className="text-base font-bold text-foreground mb-3">Estatísticas de Idade</Text>
              <View className="bg-surface rounded-xl overflow-hidden">
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
                  <Text className="text-foreground font-medium">Média</Text>
                  <Text className="text-primary font-bold">{stats.idadeMedia} anos</Text>
                </View>
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
                  <Text className="text-foreground font-medium">Mediana</Text>
                  <Text className="text-primary font-bold">{stats.idadeMediana} anos</Text>
                </View>
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
                  <Text className="text-foreground font-medium">Mínima</Text>
                  <Text className="text-primary font-bold">{stats.idadeMin} anos</Text>
                </View>
                <View className="flex-row justify-between items-center px-4 py-3">
                  <Text className="text-foreground font-medium">Máxima</Text>
                  <Text className="text-primary font-bold">{stats.idadeMax} anos</Text>
                </View>
              </View>
            </View>

            <View className="px-4 py-4">
              <Text className="text-base font-bold text-foreground mb-3">Estatísticas de Altura</Text>
              <View className="bg-surface rounded-xl overflow-hidden">
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
                  <Text className="text-foreground font-medium">Média</Text>
                  <Text className="text-primary font-bold">{stats.alturaMedia} m</Text>
                </View>
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
                  <Text className="text-foreground font-medium">Mediana</Text>
                  <Text className="text-primary font-bold">{stats.alturaMediana} m</Text>
                </View>
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
                  <Text className="text-foreground font-medium">Mínima</Text>
                  <Text className="text-primary font-bold">{stats.alturaMin} m</Text>
                </View>
                <View className="flex-row justify-between items-center px-4 py-3">
                  <Text className="text-foreground font-medium">Máxima</Text>
                  <Text className="text-primary font-bold">{stats.alturaMax} m</Text>
                </View>
              </View>
            </View>

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
          </>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Modal de Filtros com Abas */}
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

            {/* Abas */}
            <View className="flex-row border-b border-border">
              {(["posicao", "idade", "clube", "escala", "naturalidade"] as const).map((aba) => (
                <TouchableOpacity
                  key={aba}
                  onPress={() => setAbaFiltros(aba)}
                  className={`flex-1 py-3 items-center border-b-2 ${abaFiltros === aba ? "border-primary" : "border-transparent"}`}
                >
                  <Text className={`font-semibold capitalize ${abaFiltros === aba ? "text-primary" : "text-muted"}`}>
                    {aba === "posicao" ? "Posição" : aba === "idade" ? "Idade" : aba === "clube" ? "Clube" : aba === "escala" ? "Escala" : "Naturalidade"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conteúdo das Abas */}
            <ScrollView className="flex-1 px-4 py-4">
              {abaFiltros === "posicao" && (
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
                        filtros.posicoes.includes(pos) ? "bg-primary/20 border-primary" : "bg-surface border-border"
                      }`}
                    >
                      <Text className={`font-medium ${filtros.posicoes.includes(pos) ? "text-primary" : "text-foreground"}`}>
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {abaFiltros === "idade" && (
                <View className="gap-2">
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
                      className={`p-3 rounded-lg border ${
                        filtros.idades.includes(idade) ? "bg-primary/20 border-primary" : "bg-surface border-border"
                      }`}
                    >
                      <Text className={`font-medium ${filtros.idades.includes(idade) ? "text-primary" : "text-foreground"}`}>
                        {idade}-{idade + 4} anos
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {abaFiltros === "clube" && (
                <View className="gap-2">
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
                      className={`p-3 rounded-lg border ${
                        filtros.clubes.includes(clube) ? "bg-primary/20 border-primary" : "bg-surface border-border"
                      }`}
                    >
                      <Text className={`font-medium ${filtros.clubes.includes(clube) ? "text-primary" : "text-foreground"}`}>
                        {clube}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {abaFiltros === "escala" && (
                <View className="gap-2">
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
                      className={`p-3 rounded-lg border ${
                        filtros.escalas.includes(escala) ? "bg-primary/20 border-primary" : "bg-surface border-border"
                      }`}
                    >
                      <Text className={`font-medium ${filtros.escalas.includes(escala) ? "text-primary" : "text-foreground"}`}>
                        {escala}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {abaFiltros === "naturalidade" && (
                <View className="gap-2">
                  {naturalidades.map((naturalidade) => (
                    <TouchableOpacity
                      key={naturalidade}
                      onPress={() => {
                        setFiltros({
                          ...filtros,
                          naturalidades: filtros.naturalidades.includes(naturalidade)
                            ? filtros.naturalidades.filter((n) => n !== naturalidade)
                            : [...filtros.naturalidades, naturalidade],
                        });
                      }}
                      className={`p-3 rounded-lg border ${
                        filtros.naturalidades.includes(naturalidade) ? "bg-primary/20 border-primary" : "bg-surface border-border"
                      }`}
                    >
                      <Text className={`font-medium ${filtros.naturalidades.includes(naturalidade) ? "text-primary" : "text-foreground"}`}>
                        {naturalidade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Botões de Ação */}
            <View className="flex-row gap-3 px-4 py-4 border-t border-border">
              <TouchableOpacity
                onPress={handleLimparFiltros}
                className="flex-1 bg-surface border border-border rounded-lg py-3 items-center"
              >
                <Text className="text-foreground font-semibold">Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFiltros(false)}
                className="flex-1 bg-primary rounded-lg py-3 items-center"
              >
                <Text className="text-background font-semibold">Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Atletas */}
      <Modal visible={showSelecao} animationType="slide" transparent>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-background mt-12 rounded-t-3xl">
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">Selecionar Atletas</Text>
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
                  className={`px-4 py-3 border-b border-border flex-row items-center ${
                    atletasSelecionados.includes(item.id) ? "bg-primary/10" : ""
                  }`}
                >
                  <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                    atletasSelecionados.includes(item.id) ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {atletasSelecionados.includes(item.id) && (
                      <Text className="text-background font-bold text-xs">✓</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{item.nome}</Text>
                    <Text className="text-muted text-xs">{item.posicao} • {item.idade} anos</Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            <View className="flex-row gap-3 px-4 py-4 border-t border-border">
              <TouchableOpacity
                onPress={() => setAtletasSelecionados([])}
                className="flex-1 bg-surface border border-border rounded-lg py-3 items-center"
              >
                <Text className="text-foreground font-semibold">Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowSelecao(false)}
                className="flex-1 bg-primary rounded-lg py-3 items-center"
              >
                <Text className="text-background font-semibold">Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Tabela */}
      <Modal visible={showTabela} animationType="slide" transparent>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-background mt-12 rounded-t-3xl">
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">Comparativo de Atletas</Text>
              <TouchableOpacity onPress={() => setShowTabela(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={atletasSelecionados.length > 0 ? atletasFiltrados.filter((a: any) => atletasSelecionados.includes(a.id)) : atletasFiltrados}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View className="px-4 py-3 border-b border-border">
                  <Text className="text-foreground font-semibold">{item.nome}</Text>
                  <View className="flex-row gap-2 mt-2 flex-wrap">
                    <View className="bg-surface rounded px-2 py-1">
                      <Text className="text-muted text-xs">{item.posicao}</Text>
                    </View>
                    <View className="bg-surface rounded px-2 py-1">
                      <Text className="text-muted text-xs">{item.idade} anos</Text>
                    </View>
                    <View className="bg-surface rounded px-2 py-1">
                      <Text className="text-muted text-xs">{item.altura}m</Text>
                    </View>
                    {item.segundaPosicao && (
                      <View className="bg-surface rounded px-2 py-1">
                        <Text className="text-muted text-xs">{item.segundaPosicao}</Text>
                      </View>
                    )}
                  </View>
                  {item.valencia && (
                    <Text className="text-muted text-xs mt-2 italic">{item.valencia}</Text>
                  )}
                </View>
              )}
            />

            <TouchableOpacity
              onPress={() => setShowTabela(false)}
              className="m-4 bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-background font-semibold">Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
