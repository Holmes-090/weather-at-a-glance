import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/commonStyles';

export interface WeatherAlertData {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  url?: string;
  sender: string;
  area: string;
  expires?: string;
}

interface Props {
  alert: WeatherAlertData;
  onDismiss: (alertId: string) => void;
}

const severityColors = {
  minor: '#FFA500',    // Orange
  moderate: '#FF6B35', // Orange-Red
  severe: '#FF0000',   // Red
  extreme: '#8B0000',  // Dark Red
};

const severityIcons = {
  minor: 'warning-outline' as const,
  moderate: 'warning' as const,
  severe: 'alert' as const,
  extreme: 'alert-circle' as const,
};

export default function WeatherAlert({ alert, onDismiss }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleMoreInfo = async () => {
    if (alert.url) {
      try {
        const supported = await Linking.canOpenURL(alert.url);
        if (supported) {
          await Linking.openURL(alert.url);
        } else {
          Alert.alert('Error', 'Cannot open the weather alert link');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open the weather alert link');
      }
    }
  };

  const handleDismiss = () => {
    onDismiss(alert.id);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (isCollapsed) {
    return (
      <TouchableOpacity 
        style={[styles.collapsedContainer, { backgroundColor: severityColors[alert.severity] }]}
        onPress={handleToggleCollapse}
        activeOpacity={0.8}
      >
        <View style={styles.collapsedContent}>
          <Ionicons 
            name={severityIcons[alert.severity]} 
            size={16} 
            color="white" 
          />
          <Text style={styles.collapsedText} numberOfLines={1}>
            Weather Alert: {alert.title}
          </Text>
          <Ionicons name="chevron-down" size={16} color="white" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: severityColors[alert.severity] }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons 
            name={severityIcons[alert.severity]} 
            size={20} 
            color="white" 
          />
          <Text style={styles.title} numberOfLines={2}>
            {alert.title}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={handleToggleCollapse}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-up" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleDismiss}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.area}>
        {alert.area}
      </Text>

      <Text style={styles.description} numberOfLines={3}>
        {alert.description}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.sender}>
          Source: {alert.sender}
        </Text>
        {alert.url && (
          <TouchableOpacity onPress={handleMoreInfo} style={styles.moreInfoButton}>
            <Text style={styles.moreInfoText}>More Info</Text>
            <Ionicons name="open-outline" size={14} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {alert.expires && (
        <Text style={styles.expires}>
          Expires: {new Date(alert.expires).toLocaleString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  collapsedContainer: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapsedText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 8,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 4,
  },
  area: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 8,
  },
  description: {
    color: 'white',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sender: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
    flex: 1,
  },
  moreInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
  },
  moreInfoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  expires: {
    color: 'white',
    fontSize: 11,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});
