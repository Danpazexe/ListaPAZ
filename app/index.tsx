import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ShoppingBag, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Temas com cores de maior contraste

export const userThemes = {
  Daniel: {
    primary: '#0D47A1',         // Azul escuro com alto contraste
    secondary: '#1976D2',       // Azul médio
    accent: '#00796B',          // Verde-azulado escuro
    background: '#FFFFFF',      // Fundo branco para máximo contraste
    cardBackground: '#F5F9FF',  // Azul muito claro para cards
    completedBackground: '#F0F7FA', // Fundo para itens completados
    textPrimary: '#000000',     // Texto preto para máximo contraste
    textSecondary: '#455A64',   // Cinza azulado escuro para texto secundário
    border: '#BBDEFB',          // Azul claro para bordas
    isDark: false,              // Indica se é um tema escuro
    deleteButtonBackground: '#FFEBEE',
    deleteButtonColor: '#D32F2F',
    deleteButtonBorder: '#FFCDD2',
    completedBorder: '#CFD8DC',
    completedCheckbox: '#78909C',
    editButtonBackground: '#E8F4FD',
    editButtonColor: '#3498DB',
  },
  Kivhia: {
    primary: '#6A1B9A',         // Roxo escuro com alto contraste
    secondary: '#8E24AA',       // Roxo médio
    accent: '#AD1457',          // Rosa escuro
    background: '#FFFFFF',      // Fundo branco para máximo contraste
    cardBackground: '#F9F4FC',  // Roxo muito claro para cards
    completedBackground: '#F3E5F5', // Fundo para itens completados
    textPrimary: '#000000',     // Texto preto para máximo contraste
    textSecondary: '#4A148C',   // Roxo escuro para texto secundário
    border: '#E1BEE7',          // Roxo claro para bordas
    isDark: false,              // Indica se é um tema escuro
    deleteButtonBackground: '#FCE4EC',
    deleteButtonColor: '#C2185B',
    deleteButtonBorder: '#F8BBD0',
    completedBorder: '#D1C4E9',
    completedCheckbox: '#9575CD',
    editButtonBackground: '#F3E5F5',
    editButtonColor: '#8E24AA',
  }
};

// Dados dos usuários com mais informações
const userProfiles = {
  Daniel: {
    name: 'Daniel',
    initial: 'D',
    items: 12,
    lastActive: 'Hoje',
    theme: 'Azul',
  },
  Kivhia: {
    name: 'Kivhia',
    initial: 'K',
    items: 8,
    lastActive: 'Ontem',
    theme: 'Roxo',
  }
};

export default function EntryScreen() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [buttonAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Verificar se já existe um usuário salvo
    const checkSavedUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('currentUser');
        if (savedUser) {
          setSelectedUser(savedUser);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    };

    checkSavedUser();
    
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animar botão quando um usuário é selecionado
  useEffect(() => {
    if (selectedUser) {
      Animated.spring(buttonAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      buttonAnim.setValue(0);
    }
  }, [selectedUser]);

  const selectUser = async (user: string) => {
    // Feedback tátil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedUser(user);
    
    try {
      await AsyncStorage.setItem('currentUser', user);
      await AsyncStorage.setItem('userTheme', JSON.stringify(userThemes[user as keyof typeof userThemes]));
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const continueToApp = async () => {
    if (selectedUser) {
      // Feedback tátil
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animação de saída
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace('/(tabs)');
      });
    }
  };

  // Obter o tema do usuário selecionado ou usar o tema padrão
  const theme = selectedUser ? userThemes[selectedUser as keyof typeof userThemes] : userThemes.Daniel;

  // Animação do botão
  const buttonScale = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  });
  
  const buttonOpacity = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
        
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.cardBackground }]}>
            <ShoppingBag size={32} color={theme.primary} />
          </View>
          
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Lista de Compras
          </Text>
          
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Selecione seu perfil para continuar
          </Text>
        </View>
        
        <View style={styles.profilesContainer}>
          <TouchableOpacity
            style={[
              styles.profileCard,
              { 
                backgroundColor: selectedUser === 'Daniel' 
                  ? theme.cardBackground 
                  : '#F8F9FA',
                borderColor: selectedUser === 'Daniel' 
                  ? theme.primary 
                  : 'transparent',
                borderWidth: selectedUser === 'Daniel' ? 2 : 0,
              }
            ]}
            onPress={() => selectUser('Daniel')}
            activeOpacity={0.8}>
            
            <View style={styles.profileImageContainer}>
              <View style={[
                styles.profileImage,
                { backgroundColor: userThemes.Daniel.primary }
              ]}>
                <Text style={styles.profileInitial}>D</Text>
              </View>
              
              {selectedUser === 'Daniel' && (
                <View style={[styles.selectedIndicator, { backgroundColor: theme.primary }]} />
              )}
            </View>
            
            <Text style={[
              styles.profileName,
              { 
                color: selectedUser === 'Daniel' 
                  ? theme.primary 
                  : theme.textPrimary,
                fontWeight: selectedUser === 'Daniel' ? '700' : '600'
              }
            ]}>
              Daniel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.profileCard,
              { 
                backgroundColor: selectedUser === 'Kivhia' 
                  ? theme.cardBackground 
                  : '#F8F9FA',
                borderColor: selectedUser === 'Kivhia' 
                  ? userThemes.Kivhia.primary 
                  : 'transparent',
                borderWidth: selectedUser === 'Kivhia' ? 2 : 0,
              }
            ]}
            onPress={() => selectUser('Kivhia')}
            activeOpacity={0.8}>
            
            <View style={styles.profileImageContainer}>
              <View style={[
                styles.profileImage,
                { backgroundColor: userThemes.Kivhia.primary }
              ]}>
                <Text style={styles.profileInitial}>K</Text>
              </View>
              
              {selectedUser === 'Kivhia' && (
                <View style={[styles.selectedIndicator, { backgroundColor: userThemes.Kivhia.primary }]} />
              )}
            </View>
            
            <Text style={[
              styles.profileName,
              { 
                color: selectedUser === 'Kivhia' 
                  ? userThemes.Kivhia.primary 
                  : theme.textPrimary,
                fontWeight: selectedUser === 'Kivhia' ? '700' : '600'
              }
            ]}>
              Kivhia
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomContainer}>
          <Animated.View style={{
            opacity: buttonOpacity,
            transform: [{ scale: buttonScale }],
          }}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { 
                  backgroundColor: selectedUser 
                    ? (selectedUser === 'Daniel' 
                        ? userThemes.Daniel.primary 
                        : userThemes.Kivhia.primary)
                    : '#E0E0E0',
                }
              ]}
              onPress={continueToApp}
              disabled={!selectedUser}
              activeOpacity={0.8}>
              <Text style={styles.continueButtonText}>
                Continuar
              </Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.appInfo}>
            v2.0 • Desenvolvido com ♥
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.8,
  },
  profilesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 40,
  },
  profileCard: {
    width: width * 0.4,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  bottomContainer: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  appInfo: {
    marginTop: 16,
    fontSize: 12,
    opacity: 0.7,
  },
}); 