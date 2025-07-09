import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, showText = true }) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Brain-Dollar Logo */}
        <Path
          d="M30 40 C30 25, 45 15, 60 20 C75 15, 90 25, 90 40 C90 45, 87 50, 85 55 C83 60, 80 65, 75 70 C70 75, 65 80, 60 85 C55 80, 50 75, 45 70 C40 65, 37 60, 35 55 C33 50, 30 45, 30 40 Z"
          fill="#10b981"
          stroke="#065f46"
          strokeWidth="2"
        />
        {/* Dollar Sign */}
        <Path
          d="M55 30 L55 75 M45 35 C45 32, 47 30, 50 30 L70 30 C73 30, 75 32, 75 35 C75 38, 73 40, 70 40 L50 40 C47 40, 45 42, 45 45 C45 48, 47 50, 50 50 L70 50 C73 50, 75 52, 75 55 C75 58, 73 60, 70 60 L50 60 C47 60, 45 58, 45 55"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Brain texture lines */}
        <Path
          d="M40 35 Q50 32, 60 35 M40 45 Q50 42, 60 45 M40 55 Q50 52, 60 55"
          fill="none"
          stroke="#065f46"
          strokeWidth="1"
          opacity="0.3"
        />
      </Svg>
      {showText && (
        <Text style={styles.text}>Mind My Money</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46',
  },
});