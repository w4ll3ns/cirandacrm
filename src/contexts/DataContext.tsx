import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Responsavel, Aluno, OportunidadeMatricula, Conversa, Mensagem, Tarefa } from '@/types';
import * as mock from '@/data/mock';

interface DataContextType {
  responsaveis: Responsavel[];
  alunos: Aluno[];
  oportunidades: OportunidadeMatricula[];
  conversas: Conversa[];
  mensagens: Mensagem[];
  tarefas: Tarefa[];
  addMensagem: (msg: Mensagem) => void;
  addResponsavel: (resp: Responsavel) => void;
  addAluno: (aluno: Aluno) => void;
  addOportunidade: (opp: OportunidadeMatricula) => void;
  addTarefa: (tarefa: Tarefa) => void;
  updateResponsavel: (id: string, data: Partial<Responsavel>) => void;
  updateAluno: (id: string, data: Partial<Aluno>) => void;
  updateOportunidade: (id: string, data: Partial<OportunidadeMatricula>) => void;
  updateTarefa: (id: string, data: Partial<Tarefa>) => void;
  updateConversa: (id: string, data: Partial<Conversa>) => void;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>(mock.responsaveis);
  const [alunos, setAlunos] = useState<Aluno[]>(mock.alunos);
  const [oportunidades, setOportunidades] = useState<OportunidadeMatricula[]>(mock.oportunidades);
  const [conversas, setConversas] = useState<Conversa[]>(mock.conversas);
  const [mensagens, setMensagens] = useState<Mensagem[]>(mock.mensagens);
  const [tarefas, setTarefas] = useState<Tarefa[]>(mock.tarefas);

  const addMensagem = (msg: Mensagem) => {
    setMensagens(prev => [...prev, msg]);
    setConversas(prev => prev.map(c =>
      c.id === msg.conversa_id ? { ...c, ultima_mensagem_em: msg.enviada_em, atualizado_em: msg.enviada_em } : c
    ));
  };

  const addResponsavel = (resp: Responsavel) => setResponsaveis(prev => [...prev, resp]);
  const addAluno = (aluno: Aluno) => setAlunos(prev => [...prev, aluno]);
  const addOportunidade = (opp: OportunidadeMatricula) => setOportunidades(prev => [...prev, opp]);
  const addTarefa = (tarefa: Tarefa) => setTarefas(prev => [...prev, tarefa]);

  const updateResponsavel = (id: string, data: Partial<Responsavel>) => {
    setResponsaveis(prev => prev.map(r => r.id === id ? { ...r, ...data, atualizado_em: new Date().toISOString() } : r));
  };

  const updateAluno = (id: string, data: Partial<Aluno>) => {
    setAlunos(prev => prev.map(a => a.id === id ? { ...a, ...data, atualizado_em: new Date().toISOString() } : a));
  };

  const updateOportunidade = (id: string, data: Partial<OportunidadeMatricula>) => {
    setOportunidades(prev => prev.map(o => o.id === id ? { ...o, ...data, atualizado_em: new Date().toISOString() } : o));
  };

  const updateTarefa = (id: string, data: Partial<Tarefa>) => {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, ...data, atualizado_em: new Date().toISOString() } : t));
  };

  const updateConversa = (id: string, data: Partial<Conversa>) => {
    setConversas(prev => prev.map(c => c.id === id ? { ...c, ...data, atualizado_em: new Date().toISOString() } : c));
  };

  return (
    <DataContext.Provider value={{
      responsaveis, alunos, oportunidades, conversas, mensagens, tarefas,
      addMensagem, addResponsavel, addAluno, addOportunidade, addTarefa,
      updateResponsavel, updateAluno, updateOportunidade, updateTarefa, updateConversa,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
