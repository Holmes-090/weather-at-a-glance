
import { useEffect, useRef, useState, ReactNode } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, ScrollView, Keyboard, Platform } from 'react-native';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';
import { searchCities, GeocodeResult } from '../hooks/useGeocoding';

interface Props {
  placeholder?: string;
  onSelectCity: (city: { name: string; latitude: number; longitude: number; country?: string }) => void;
  onOptionsPress: () => void;
  locationButton?: ReactNode;
}

export default function SearchBar({ placeholder = 'Search', onSelectCity, onOptionsPress, locationButton }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const typingTimeout = useRef<any>(null);
  const isSelecting = useRef(false); // Use ref to prevent re-renders

  useEffect(() => {
    if (!query) {
      setResults([]);
      setOpen(false);
      return;
    }
    
    // Don't search if we're in the middle of selecting
    if (isSelecting.current) {
      return;
    }
    
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(async () => {
      // Double-check we're not selecting before making the API call
      if (isSelecting.current) return;
      
      try {
        const r = await searchCities(query);
        // Only update if we're still not selecting
        if (!isSelecting.current) {
          setResults(r);
          setOpen(true);
        }
      } catch (e) {
        console.log('Geocode error', e);
      }
    }, 300);

    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [query]);

  const handleSelect = (r: GeocodeResult) => {
    isSelecting.current = true; // Block any searches
    
    // Clear timeout to prevent pending searches
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    setResults([]);
    setOpen(false);
    setQuery(`${r.name}${r.country ? ', ' + r.country : ''}`);
    Keyboard.dismiss();
    onSelectCity({ name: r.name, latitude: r.latitude, longitude: r.longitude, country: r.country });
    
    // Reset the selection flag after a delay to allow the query to settle
    setTimeout(() => {
      isSelecting.current = false;
    }, 100);
  };

  const handleClear = () => {
    isSelecting.current = false;
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleTextChange = (text: string) => {
    // If user starts typing, reset the selection flag
    if (text !== query) {
      isSelecting.current = false;
    }
    setQuery(text);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <Icon name="search" size={20} color={colors.text} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={query}
          onChangeText={handleTextChange}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (results[0] && !isSelecting.current) handleSelect(results[0]);
          }}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton} activeOpacity={0.8}>
            <Icon name="close-circle" size={16} color={colors.text} />
          </TouchableOpacity>
        )}
        {locationButton && (
          <View style={styles.locationButtonContainer}>
            {locationButton}
          </View>
        )}
        <TouchableOpacity onPress={onOptionsPress} style={styles.optionsButton} activeOpacity={0.8}>
          <Icon name="options" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      {open && results.length > 0 && !isSelecting.current && (
        <View style={styles.dropdown}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 240 }}>
            {results.map((r) => (
              <TouchableOpacity key={`${r.id}-${r.latitude}-${r.longitude}`} onPress={() => handleSelect(r)} style={styles.resultRow}>
                <Text style={styles.resultText}>{r.name}{r.country ? `, ${r.country}` : ''}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    zIndex: 10,
  },
  inputRow: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 44,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.25)',
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  clearButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  locationButtonContainer: {
    paddingHorizontal: 4,
  },
  optionsButton: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  dropdown: {
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    marginTop: 8,
    boxShadow: '0px 6px 16px rgba(0,0,0,0.35)',
  },
  resultRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resultText: {
    color: colors.text,
    fontSize: 16,
  },
});
