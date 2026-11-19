import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { c } from '../theme';

export default function Logo({ width = 100 }) {
  return (
    <Svg width={width} height={width * 1.2} viewBox="0 0 100 120">
      <Path d="M0 20 C20 0,70 0,100 20 C70 40,20 40,0 20Z" fill={c.green} />
      <Path d="M0 20 C20 40,50 80,20 120 C0 90,0 40,0 20Z" fill={c.blue} />
      <Path d="M0 50 L60 20 L20 100Z" fill={c.green} opacity={0.8} />
    </Svg>
  );
}
