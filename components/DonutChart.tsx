import React from 'react'
import { Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

const SIZE = 190
const STROKE = 20
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function DonutChart({ data, total, corDestaque, tipoFiltro, formatCompact }: any) {
  let accumulated = 0

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE}>
        {/* fundo */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#e2e8f0"
          strokeWidth={STROKE}
          fill="transparent"
        />

        {/* fatias */}
        {data.map((item: any, index: any) => {
          const percentage = item.valor / total
          const strokeDasharray = CIRCUMFERENCE
          const strokeDashoffset =
            CIRCUMFERENCE - percentage * CIRCUMFERENCE

          const rotation = (accumulated / total) * 360
          accumulated += item.valor

          return (
            <Circle
              key={index}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={item.cor}
              strokeWidth={STROKE}
              fill="transparent"
              strokeDasharray={`${strokeDasharray}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation={rotation}
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          )
        })}
      </Svg>

      {/* TEXTO CENTRAL (igual seu Next absolute inset-0) */}
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: corDestaque, fontSize: 28, fontWeight: '800' }}>
          R$ {formatCompact(total)}
        </Text>

        <Text style={{ color: '#64748b', fontSize: 12 }}>
          Total {tipoFiltro === 'Despesa' ? 'Gasto' : 'Recebido'}
        </Text>
      </View>
    </View>
  )
}

export default DonutChart