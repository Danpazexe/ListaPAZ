import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Configuração do Supabase
const supabaseUrl = 'https://wpdxxrgnolyycaepgdbt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZHh4cmdub2x5eWNhZXBnZGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwODQzOTMsImV4cCI6MjA1NzY2MDM5M30.T4Re_vkI9BeSE4MKX2OKkbQzQz5-ymOVLC8G8_U8E10';

// Criar e exportar o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Interface para os itens da lista de compras
export interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
  quantity: number;
  created_at: string;
  added_by: string;
  category: string;
}

// Funções para interagir com o banco de dados

// Buscar todos os itens
export async function fetchItems() {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    throw new Error(`Erro ao buscar itens: ${error.message}`);
  }
  
  return data;
}

// Adicionar um novo item
export const addItem = async (item: {
  id: string;
  name: string;
  completed: boolean;
  quantity?: number;
  createdAt: number;
  addedBy: string;
  category: string;
}) => {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert([
      {
        id: item.id,
        name: item.name,
        completed: item.completed,
        quantity: item.quantity || 1,
        added_by: item.addedBy,
        category: item.category,
        created_at: new Date(item.createdAt).toISOString(),
      }
    ])
    .select();

  if (error) throw error;
  return data;
};

// Atualizar um item existente
export const updateItem = async (id: string, updates: Partial<ShoppingItem>) => {
  const { data, error } = await supabase
    .from('shopping_items')
    .update({
      ...updates,
      ...(updates.added_by && { added_by: updates.added_by }),
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};

// Excluir um item
export async function deleteItem(id: string) {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', id);
    
  if (error) {
    throw new Error(`Erro ao excluir item: ${error.message}`);
  }
}

// Configurar canal para mudanças em tempo real
export function setupRealtimeSubscription(onUpdate: () => void) {
  return supabase
    .channel('shopping_items_changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'shopping_items'
    }, () => {
      onUpdate();
    })
    .subscribe();
} 