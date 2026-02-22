import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi, gamesApi, statsApi } from '@/services/api';
import toast from 'react-hot-toast';

export const useLibrary = (params?: { platform?: string; status?: string; page?: number }) =>
  useQuery({
    queryKey: ['library', params],
    queryFn: () => libraryApi.getAll(params),
    staleTime: 30_000,
  });

export const useAddToLibrary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: libraryApi.add,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Añadido a tu biblioteca');
    },
    onError: () => toast.error('Error al añadir el juego'),
  });
};

export const useRemoveFromLibrary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Eliminado de tu biblioteca');
    },
    onError: () => toast.error('Error al eliminar'),
  });
};

export const useGameSearch = (query: string, page = 1) =>
  useQuery({
    queryKey: ['games', 'search', query, page],
    queryFn: () => gamesApi.search(query, page),
    enabled: query.length > 2,
    staleTime: 5 * 60_000,
  });

export const usePopularGames = (page = 1) =>
  useQuery({
    queryKey: ['games', 'popular', page],
    queryFn: () => gamesApi.popular(page),
    staleTime: 10 * 60_000,
  });

export const useClearLibrary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => libraryApi.clearAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Biblioteca vaciada');
    },
    onError: () => toast.error('Error al vaciar la biblioteca'),
  });
};

export const useStats = () =>
  useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.get,
    staleTime: 60_000,
  });
