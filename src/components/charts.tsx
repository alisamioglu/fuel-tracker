import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';

// Two small one-color charts. No legend needed (one series, the card title names it),
// thin marks, faint grid, and tapping a bar or dot shows its exact value on top.

export type ChartPoint = {
  label: string; // short label under the axis, e.g. "Oct"
  title: string; // full label for the readout, e.g. "October 2026"
  value: number;
  display: string; // formatted value, e.g. "₺3.150,00"
};

const HEIGHT = 140;
const TOP = 12;
const BOTTOM = 22;

function useWidth() {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return { width, onLayout };
}

function Readout({ point }: { point: ChartPoint | undefined }) {
  if (!point) return <View style={styles.readout} />;
  return (
    <View style={styles.readout}>
      <ThemedText type="small" themeColor="textSecondary">
        {point.title}
      </ThemedText>
      <ThemedText type="smallBold">{point.display}</ThemedText>
    </View>
  );
}

function Grid({ width }: { width: number }) {
  const theme = useTheme();
  const plot = HEIGHT - TOP - BOTTOM;
  return (
    <>
      {[0, 0.5, 1].map((f) => (
        <Line
          key={f}
          x1={0}
          x2={width}
          y1={TOP + plot * f}
          y2={TOP + plot * f}
          stroke={theme.border}
          strokeWidth={1}
          strokeDasharray={f === 1 ? undefined : '3 4'}
        />
      ))}
    </>
  );
}

function AxisLabels({ points, xOf }: { points: ChartPoint[]; xOf: (i: number) => number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {points.map((p, i) => (
        <ThemedText
          key={i}
          type="small"
          themeColor="textSecondary"
          style={[styles.axisLabel, { left: xOf(i) - 30, top: HEIGHT - BOTTOM + 4 }]}>
          {p.label}
        </ThemedText>
      ))}
    </View>
  );
}

export function BarChart({ points }: { points: ChartPoint[] }) {
  const theme = useTheme();
  const { width, onLayout } = useWidth();
  // The newest bar is selected at first, that's usually what I want to know
  const [selected, setSelected] = useState(points.length - 1);

  const plot = HEIGHT - TOP - BOTTOM;
  const max = Math.max(...points.map((p) => p.value), 1);
  const slot = points.length > 0 ? width / points.length : 0;
  const barWidth = Math.min(slot * 0.55, 34);
  const xOf = (i: number) => slot * i + slot / 2;

  return (
    <View>
      <Readout point={points[selected]} />
      <View onLayout={onLayout} style={{ height: HEIGHT }}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            <Grid width={width} />
            {points.map((p, i) => {
              const h = Math.max((p.value / max) * plot, 4);
              const x = xOf(i) - barWidth / 2;
              const y = TOP + plot - h;
              const r = Math.min(4, barWidth / 2);
              // Rounded top, flat bottom that sits on the baseline
              const d = `M${x},${TOP + plot} V${y + r} Q${x},${y} ${x + r},${y} H${x + barWidth - r} Q${x + barWidth},${y} ${x + barWidth},${y + r} V${TOP + plot} Z`;
              return (
                <Path
                  key={i}
                  d={d}
                  fill={theme.primary}
                  opacity={i === selected ? 1 : 0.45}
                />
              );
            })}
          </Svg>
        )}
        <AxisLabels points={points} xOf={xOf} />
        {/* Tap targets are the whole column, much bigger than the bar itself */}
        <View style={[StyleSheet.absoluteFill, styles.hitRow]}>
          {points.map((_, i) => (
            <Pressable
              key={i}
              style={styles.hit}
              onPress={() => {
                tapFeedback();
                setSelected(i);
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export function LineChart({ points }: { points: ChartPoint[] }) {
  const theme = useTheme();
  const { width, onLayout } = useWidth();
  const [selected, setSelected] = useState(points.length - 1);

  const plot = HEIGHT - TOP - BOTTOM;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A bit of air above and below so the line doesn't touch the edges
  const pad = (max - min) * 0.2 || max * 0.1 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const inset = 16;
  const step = points.length > 1 ? (width - inset * 2) / (points.length - 1) : 0;
  const xOf = (i: number) => (points.length > 1 ? inset + step * i : width / 2);
  const yOf = (v: number) => TOP + plot - ((v - lo) / (hi - lo)) * plot;

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(p.value)}`).join(' ');

  return (
    <View>
      <Readout point={points[selected]} />
      <View onLayout={onLayout} style={{ height: HEIGHT }}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            <Grid width={width} />
            <Path d={d} stroke={theme.primary} strokeWidth={2} fill="none" strokeLinejoin="round" />
            {points.map((p, i) => (
              <Circle
                key={i}
                cx={xOf(i)}
                cy={yOf(p.value)}
                r={i === selected ? 6 : 4}
                fill={i === selected ? theme.primary : theme.backgroundElement}
                stroke={theme.primary}
                strokeWidth={2}
              />
            ))}
            {selected >= 0 && points[selected] && (
              <Rect
                x={xOf(selected) - 0.5}
                y={TOP}
                width={1}
                height={plot}
                fill={theme.primary}
                opacity={0.25}
              />
            )}
          </Svg>
        )}
        <AxisLabels points={points} xOf={xOf} />
        <View style={[StyleSheet.absoluteFill, styles.hitRow]}>
          {points.map((_, i) => (
            <Pressable
              key={i}
              style={styles.hit}
              onPress={() => {
                tapFeedback();
                setSelected(i);
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 20,
    marginBottom: Spacing.two,
  },
  axisLabel: {
    position: 'absolute',
    width: 60,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  hitRow: {
    flexDirection: 'row',
  },
  hit: {
    flex: 1,
  },
});
