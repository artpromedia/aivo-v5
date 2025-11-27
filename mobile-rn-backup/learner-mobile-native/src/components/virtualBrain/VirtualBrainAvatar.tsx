import React from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';

interface VirtualBrainAvatarProps {
  state?: any;
  isActive: boolean;
  size?: number;
}

const VirtualBrainAvatar: React.FC<VirtualBrainAvatarProps> = ({
  isActive,
  size = 80,
}) => {
  const color = isActive ? '#8B5CF6' : '#9CA3AF';

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Brain outline */}
        <Path
          d="M50,20 C35,20 25,30 25,45 C25,50 26,55 28,58 L28,75 C28,82 34,88 42,88 L58,88 C66,88 72,82 72,75 L72,58 C74,55 75,50 75,45 C75,30 65,20 50,20 Z"
          fill={color}
          opacity={0.2}
        />
        {/* Brain details */}
        <Path
          d="M40,35 Q45,30 50,35 T60,35"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M35,50 Q40,45 45,50 T55,50"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        <Circle cx="42" cy="45" r="3" fill={color} />
        <Circle cx="58" cy="45" r="3" fill={color} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VirtualBrainAvatar;
