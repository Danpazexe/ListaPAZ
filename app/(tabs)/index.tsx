import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Pressable,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Trash2, Check, Search, X, ShoppingBag } from 'lucide-react-native';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { userThemes } from '../index';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Configuração do Supabase
const supabaseUrl = 'https://wpdxxrgnolyycaepgdbt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZHh4cmdub2x5eWNhZXBnZGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwODQzOTMsImV4cCI6MjA1NzY2MDM5M30.T4Re_vkI9BeSE4MKX2OKkbQzQz5-ymOVLC8G8_U8E10';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Item {
  id: string;
  name: string;
  completed: boolean;
  quantity: number;
  createdAt: number;
  addedBy?: string;
  priority?: boolean;
}

type RouteParams = {
  showAddModal?: boolean;
};

type Props = {
  route?: RouteProp<Record<string, RouteParams>, string>;
};

export default function ShoppingListScreen(props: any) {
  const route = props?.route || {};
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState('Daniel');
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(userThemes.Daniel);
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const newItemInputRef = useRef(null);

  useEffect(() => {
    loadItems();
    loadCurrentUser();

    // Adicionar listeners para o teclado
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    // Configurar listener para mudanças em tempo real
    const subscription = supabase
      .channel('shopping_items_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shopping_items' 
      }, payload => {
        console.log('Mudança detectada:', payload);
        loadItems();
      })
      .subscribe();

    // Limpar listeners ao desmontar
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (route.params?.showAddModal) {
      setShowAddModal(true);
      // Limpar o parâmetro para não reabrir o modal em atualizações futuras
      if (route.params) {
        route.params.showAddModal = false;
      }
    }
  }, [route.params]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      // Primeiro tentamos carregar do Supabase
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar do Supabase:', error);
        // Se falhar, tentamos carregar do armazenamento local
        const savedItems = await AsyncStorage.getItem('shoppingList');
        if (savedItems) {
          setItems(JSON.parse(savedItems));
        }
      } else {
        // Formatar os dados do Supabase para o formato da aplicação
        const formattedItems = data.map(item => ({
          id: item.id,
          name: item.name,
          completed: item.completed,
          quantity: item.quantity,
          createdAt: new Date(item.created_at).getTime(),
          addedBy: item.added_by,
        }));
        setItems(formattedItems);
        // Atualizar o armazenamento local com os dados mais recentes
        await AsyncStorage.setItem('shoppingList', JSON.stringify(formattedItems));
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('currentUser');
      if (savedUser) {
        setCurrentUser(savedUser);
        
        // Carregar o tema do usuário
        const savedTheme = await AsyncStorage.getItem('userTheme');
        if (savedTheme) {
          setTheme(JSON.parse(savedTheme));
        } else {
          // Usar o tema padrão baseado no usuário
          setTheme(userThemes[savedUser as keyof typeof userThemes]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  };

  const saveItems = async (newItems: Item[]) => {
    try {
      // Salvar localmente primeiro para garantir resposta rápida da UI
      await AsyncStorage.setItem('shoppingList', JSON.stringify(newItems));
    } catch (error) {
      console.error('Erro ao salvar localmente:', error);
    }
  };

  const addItem = async () => {
    if (newItem.trim()) {
      const newItemData = {
        id: Date.now().toString(),
        name: newItem.trim(),
        completed: false,
        quantity: 1,
        createdAt: Date.now(),
        addedBy: currentUser,
      };

      // Atualizar UI imediatamente
      const newItems = [newItemData, ...items];
      setItems(newItems);
      saveItems(newItems);
      setNewItem('');

      // Salvar no Supabase
      try {
        const { error } = await supabase
          .from('shopping_items')
          .insert({
            id: newItemData.id,
            name: newItemData.name,
            completed: newItemData.completed,
            quantity: newItemData.quantity,
            created_at: new Date(newItemData.createdAt).toISOString(),
            added_by: newItemData.addedBy,
          });

        if (error) {
          console.error('Erro ao adicionar item no Supabase:', error);
        }
      } catch (error) {
        console.error('Erro ao adicionar item:', error);
      }
    }
  };

  const toggleItem = async (id: string) => {
    // Encontrar o item para obter seu estado atual
    const itemToUpdate = items.find(item => item.id === id);
    if (!itemToUpdate) return;

    // Atualizar localmente primeiro
    const newItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(newItems);
    saveItems(newItems);

    // Atualizar no Supabase
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ completed: !itemToUpdate.completed })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar item no Supabase:', error);
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  const togglePriority = (id: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, priority: !item.priority } : item
    );
    setItems(newItems);
    saveItems(newItems);
  };

  const updateQuantity = async (id: string, increment: boolean) => {
    // Encontrar o item para obter sua quantidade atual
    const itemToUpdate = items.find(item => item.id === id);
    if (!itemToUpdate) return;

    const newQuantity = increment
      ? itemToUpdate.quantity + 1
      : Math.max(1, itemToUpdate.quantity - 1);

    // Atualizar localmente primeiro
    const newItems = items.map(item =>
      item.id === id
        ? {
            ...item,
            quantity: newQuantity,
          }
        : item
    );
    setItems(newItems);
    saveItems(newItems);

    // Atualizar no Supabase
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ quantity: newQuantity })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar quantidade no Supabase:', error);
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
    }
  };

  const deleteItem = async (id: string, completed: boolean) => {
    // Se o item estiver completo, mostrar mensagem e não permitir exclusão
    if (completed) {
      Alert.alert(
        "Ação não permitida",
        "Itens completos não podem ser excluídos. Desmarque o item primeiro.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    
    // Continuar com a exclusão normalmente
    try {
      // Atualizar UI imediatamente
      const newItems = items.filter(item => item.id !== id);
      setItems(newItems);
      saveItems(newItems);

      // Excluir do Supabase
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir item do Supabase:', error);
      }
    } catch (error) {
      console.error('Erro ao excluir item:', error);
    }
  };

  const filteredItems = items
    .filter(item => {
      // Filtrar por tab (todos ou pendentes)
      return activeTab === 'all' || !item.completed;
    })
    .filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Ordenar por status de conclusão
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      
      // Por fim, por data de criação
      return b.createdAt - a.createdAt;
    });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => {
            setActiveTab('all');
          }}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => {
            setActiveTab('pending');
          }}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pendentes
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.listCount}>
        {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
      </Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: Item, index: number }) => {
    return (
      <View style={[
        styles.item, 
        { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.border
        },
        item.completed && [
          styles.completedItem,
          { 
            backgroundColor: theme.completedBackground,
            borderColor: theme.completedBorder,
            borderStyle: 'dashed'
          }
        ]
      ]}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            { borderColor: item.completed ? theme.completedCheckbox : theme.primary },
            item.completed && styles.checkboxChecked,
            item.completed && { backgroundColor: theme.completedCheckbox }
          ]}
          onPress={() => toggleItem(item.id)}>
          {item.completed && <Check size={16} color="#FFFFFF" />}
        </TouchableOpacity>
        <Pressable 
          style={styles.itemContent}
          onPress={() => toggleItem(item.id)}>
          <Text style={[
            styles.itemText, 
            { color: theme.textPrimary },
            item.completed && [
              styles.completedText,
              { 
                color: theme.textSecondary,
                textDecorationColor: theme.textSecondary
              }
            ]
          ]}>
            {item.name}
          </Text>
          
          {item.addedBy && (
            <Text style={[
              styles.addedByText, 
              { color: theme.textSecondary }
            ]}>
              Adicionado por {item.addedBy}
            </Text>
          )}
          
          <View style={styles.itemActions}>
            {!item.completed ? (
              <View style={[
                styles.quantityContainer,
                { borderColor: theme.border }
              ]}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    updateQuantity(item.id, false);
                  }}>
                  <Text style={[styles.quantityButtonText, { color: theme.primary }]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.quantityText, { color: theme.textPrimary }]}>
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    updateQuantity(item.id, true);
                  }}>
                  <Text style={[styles.quantityButtonText, { color: theme.primary }]}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.completedQuantity, { backgroundColor: theme.completedBackground }]}>
                <Text style={[styles.completedQuantityText, { color: theme.textSecondary }]}>
                  {item.quantity} {item.quantity > 1 ? 'itens' : 'item'}
                </Text>
              </View>
            )}
            {!item.completed && (
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  { backgroundColor: theme.deleteButtonBackground }
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  deleteItem(item.id, item.completed);
                }}>
                <Trash2 size={20} color={theme.deleteButtonColor} />
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </View>
    );
  };


  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <KeyboardAvoidingView 
          style={[styles.container, { backgroundColor: theme.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
          
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.titleContainer}>
              <View style={[styles.titleIconContainer, { backgroundColor: theme.cardBackground }]}>
                <ShoppingBag size={24} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Lista de Compras</Text>
            </View>
            
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: theme.cardBackground }]}
                onPress={() => setShowSearch(!showSearch)}>
                {showSearch ? (
                  <X size={22} color={theme.primary} />
                ) : (
                  <Search size={22} color={theme.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Search size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Buscar ou adicionar item..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                if (searchQuery.trim() && !items.some(item => 
                  item.name.toLowerCase() === searchQuery.toLowerCase()
                )) {
                  Alert.alert(
                    "Adicionar Item",
                    `Deseja adicionar "${searchQuery}" à lista?`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      { 
                        text: "Adicionar", 
                        onPress: () => {
                          setNewItem(searchQuery);
                          addItem();
                          setSearchQuery('');
                        }
                      }
                    ]
                  );
                }
              }}
            />
            {searchQuery ? (
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: theme.border }]}
                onPress={() => setSearchQuery('')}>
                <X size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              {!keyboardVisible && (
                <>
                  <View style={styles.emptyImageContainer}>
                    <Image 
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076432.png' }} 
                      style={styles.emptyImage} 
                    />
                  </View>
                  <Text style={styles.emptyText}>Sua lista está vazia</Text>
                  <Text style={styles.emptySubText}>Adicione itens para começar suas compras</Text>
                </>
              )}
            </View>
          ) : (
            <>
              {renderListHeader()}
              
              {filteredItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyImageContainer}>
                    <Image 
                      source={{ uri: activeTab === 'pending' 
                        ? 'https://cdn-icons-png.flaticon.com/512/190/190411.png'
                        : 'https://cdn-icons-png.flaticon.com/512/751/751463.png' 
                      }} 
                      style={styles.emptyImage} 
                    />
                  </View>
                  <Text style={styles.emptyText}>
                    {activeTab === 'pending' 
                      ? 'Nenhum item pendente' 
                      : 'Nenhum resultado'}
                  </Text>
                  <Text style={styles.emptySubText}>
                    {activeTab === 'pending' 
                      ? 'Todos os itens foram concluídos' 
                      : 'Tente outra busca'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredItems}
                  renderItem={renderItem}
                  keyExtractor={item => item.id}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  contentContainerStyle={styles.listContent}
                />
              )}
            </>
          )}

          <Modal
            visible={showAddModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowAddModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Adicionar Item</Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <X size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  ref={newItemInputRef}
                  style={[styles.modalInput, { backgroundColor: theme.cardBackground, color: theme.textPrimary }]}
                  placeholder="Nome do item"
                  placeholderTextColor={theme.textSecondary}
                  value={newItem}
                  onChangeText={setNewItem}
                  autoFocus
                />
                
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.primary },
                    !newItem.trim() && { opacity: 0.5 }
                  ]}
                  disabled={!newItem.trim()}
                  onPress={() => {
                    addItem();
                    setShowAddModal(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={[styles.bottomBar, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity 
              style={[styles.bottomAddButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowAddModal(true)}>
              <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    borderBottomWidth: 1,
    paddingBottom: 15,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  searchButton: {
    padding: 8,
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#34495E',
  },
  clearButton: {
    backgroundColor: '#E8EDF1',
    borderRadius: 10,
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputWrapper: {
    flex: 1,
    marginRight: 10,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#34495E',
  },
  addButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#B3C2D1',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF2F7',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  activeTabText: {
    color: '#3498DB',
    fontWeight: '700',
  },
  listCount: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
    backgroundColor: '#EFF2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  completedItem: {
    opacity: 0.85,
    borderWidth: 1,
    borderRadius: 16,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3498DB',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 17,
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
    opacity: 0.8,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  quantityText: {
    fontSize: 16,
    minWidth: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionButton: {
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyImageContainer: {
    width: 160,
    height: 160,
    backgroundColor: '#F5F7FA',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  emptyImage: {
    width: 100,
    height: 100,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7F8C8D',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: '#95A5A6',
    marginTop: 10,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 22,
  },
  addedByText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
    fontWeight: '500',
  },
  completedQuantity: {
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E8EDF1',
  },
  completedQuantityText: {
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledDeleteButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalInput: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButton: {
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomBar: {
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#E8EDF1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomAddButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
});