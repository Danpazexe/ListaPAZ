import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';

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

export default function EntryScreen() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

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
  }, []);

  const selectUser = async (user: string) => {
    setSelectedUser(user);
    try {
      await AsyncStorage.setItem('currentUser', user);
      // Salvar o tema do usuário
      await AsyncStorage.setItem('userTheme', JSON.stringify(userThemes[user as keyof typeof userThemes]));
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const continueToApp = async () => {
    if (selectedUser) {
      router.replace('/(tabs)');
    }
  };

  // Obter o tema do usuário selecionado ou usar o tema padrão
  const theme = selectedUser ? userThemes[selectedUser as keyof typeof userThemes] : userThemes.Daniel;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: theme.cardBackground }]}>
          <ShoppingBag size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Lista de Compras</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Quem está usando o app hoje?</Text>
      </View>
      
      <View style={styles.userContainer}>
        <TouchableOpacity
          style={[
            styles.userCard,
            { backgroundColor: userThemes.Daniel.cardBackground, borderColor: userThemes.Daniel.cardBackground },
            selectedUser === 'Daniel' && { borderColor: userThemes.Daniel.primary }
          ]}
          onPress={() => selectUser('Daniel')}
        >
          <View style={[
            styles.userAvatar,
            { backgroundColor: selectedUser === 'Daniel' ? userThemes.Daniel.primary : '#EFF2F7' }
          ]}>
            <Text style={[
              styles.userInitial,
              { color: selectedUser === 'Daniel' ? '#FFFFFF' : userThemes.Daniel.textSecondary }
            ]}>D</Text>
          </View>
          <Text style={[
            styles.userName,
            { color: userThemes.Daniel.textPrimary },
            selectedUser === 'Daniel' && { color: userThemes.Daniel.primary, fontWeight: 'bold' }
          ]}>Daniel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.userCard,
            { backgroundColor: userThemes.Kivhia.cardBackground, borderColor: userThemes.Kivhia.cardBackground },
            selectedUser === 'Kivhia' && { borderColor: userThemes.Kivhia.primary }
          ]}
          onPress={() => selectUser('Kivhia')}
        >
          <View style={[
            styles.userAvatar,
            { backgroundColor: selectedUser === 'Kivhia' ? userThemes.Kivhia.primary : '#EFF2F7' }
          ]}>
            <Text style={[
              styles.userInitial,
              { color: selectedUser === 'Kivhia' ? '#FFFFFF' : userThemes.Kivhia.textSecondary }
            ]}>K</Text>
          </View>
          <Text style={[
            styles.userName,
            { color: userThemes.Kivhia.textPrimary },
            selectedUser === 'Kivhia' && { color: userThemes.Kivhia.primary, fontWeight: 'bold' }
          ]}>Kivhia</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: theme.primary },
          !selectedUser && styles.continueButtonDisabled
        ]}
        onPress={continueToApp}
        disabled={!selectedUser}
      >
        <Text style={styles.continueButtonText}>Continuar</Text>
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1261/1261163.png' }}
          style={styles.footerImage}
        />
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          Compartilhe sua lista de compras
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#E1F5FE',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 60,
  },
  userCard: {
    width: width * 0.42,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F7FA',
  },
  selectedUserCard: {
    borderColor: '#3498DB',
    backgroundColor: '#E1F5FE',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedUserAvatar: {
    backgroundColor: '#3498DB',
  },
  userInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7F8C8D',
  },
  selectedUserInitial: {
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
  },
  selectedUserName: {
    color: '#3498DB',
  },
  continueButton: {
    backgroundColor: '#3498DB',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  continueButtonDisabled: {
    backgroundColor: '#B3C2D1',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerImage: {
    width: 100,
    height: 100,
    opacity: 0.8,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
  },
}); 