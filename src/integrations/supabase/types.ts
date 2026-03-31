export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          created_at: string
          data_nascimento: string | null
          id: string
          nome: string
          observacoes: string | null
          responsavel_id: string
          serie_interesse: string | null
          unidade_interesse: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          responsavel_id: string
          serie_interesse?: string | null
          unidade_interesse?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          responsavel_id?: string
          serie_interesse?: string | null
          unidade_interesse?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alunos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          ativo: boolean | null
          configuracao: Json
          created_at: string
          gatilho: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          configuracao?: Json
          created_at?: string
          gatilho: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          configuracao?: Json
          created_at?: string
          gatilho?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      broadcast_logs: {
        Row: {
          caption: string | null
          created_at: string
          error_count: number
          group_phones: string[]
          id: string
          link_description: string | null
          link_image: string | null
          link_title: string | null
          link_url: string | null
          media_url: string | null
          message: string | null
          results: Json
          sent_count: number
          type: string
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          error_count?: number
          group_phones: string[]
          id?: string
          link_description?: string | null
          link_image?: string | null
          link_title?: string | null
          link_url?: string | null
          media_url?: string | null
          message?: string | null
          results?: Json
          sent_count?: number
          type: string
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          error_count?: number
          group_phones?: string[]
          id?: string
          link_description?: string | null
          link_image?: string | null
          link_title?: string | null
          link_url?: string | null
          media_url?: string | null
          message?: string | null
          results?: Json
          sent_count?: number
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campaign_groups: {
        Row: {
          campaign_id: string
          community_id: string
          community_name: string
          created_at: string
          group_name: string
          group_phone: string
          id: string
          max_participants: number
          sort_order: number
        }
        Insert: {
          campaign_id: string
          community_id: string
          community_name: string
          created_at?: string
          group_name: string
          group_phone: string
          id?: string
          max_participants?: number
          sort_order?: number
        }
        Update: {
          campaign_id?: string
          community_id?: string
          community_name?: string
          created_at?: string
          group_name?: string
          group_phone?: string
          id?: string
          max_participants?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_groups_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "community_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      community_campaigns: {
        Row: {
          ativa: boolean
          auto_create_community: boolean
          cor_fundo: string
          cor_primaria: string
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          slug: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          auto_create_community?: boolean
          cor_fundo?: string
          cor_primaria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          slug: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          auto_create_community?: boolean
          cor_fundo?: string
          cor_primaria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_contacts: {
        Row: {
          campaign_id: string | null
          community_id: string
          community_name: string | null
          created_at: string
          group_name: string | null
          group_phone: string | null
          id: string
          joined_at: string
          name: string | null
          phone: string
        }
        Insert: {
          campaign_id?: string | null
          community_id: string
          community_name?: string | null
          created_at?: string
          group_name?: string | null
          group_phone?: string | null
          id?: string
          joined_at?: string
          name?: string | null
          phone: string
        }
        Update: {
          campaign_id?: string | null
          community_id?: string
          community_name?: string | null
          created_at?: string
          group_name?: string | null
          group_phone?: string | null
          id?: string
          joined_at?: string
          name?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "community_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      community_disabled: {
        Row: {
          community_id: string
          disabled_at: string
          disabled_by: string | null
          id: string
        }
        Insert: {
          community_id: string
          disabled_at?: string
          disabled_by?: string | null
          id?: string
        }
        Update: {
          community_id?: string
          disabled_at?: string
          disabled_by?: string | null
          id?: string
        }
        Relationships: []
      }
      conversation_assignments_history: {
        Row: {
          changed_by: string | null
          conversation_id: string
          created_at: string
          id: string
          motivo: string | null
          new_user_id: string | null
          previous_user_id: string | null
        }
        Insert: {
          changed_by?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          motivo?: string | null
          new_user_id?: string | null
          previous_user_id?: string | null
        }
        Update: {
          changed_by?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          motivo?: string | null
          new_user_id?: string | null
          previous_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_assignments_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_flow_sessions: {
        Row: {
          context: Json
          conversation_id: string
          current_node_id: string | null
          finished_at: string | null
          flow_id: string
          id: string
          last_input: string | null
          started_at: string
          status: Database["public"]["Enums"]["flow_session_status"]
          updated_at: string
        }
        Insert: {
          context?: Json
          conversation_id: string
          current_node_id?: string | null
          finished_at?: string | null
          flow_id: string
          id?: string
          last_input?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["flow_session_status"]
          updated_at?: string
        }
        Update: {
          context?: Json
          conversation_id?: string
          current_node_id?: string | null
          finished_at?: string | null
          flow_id?: string
          id?: string
          last_input?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["flow_session_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_flow_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_flow_sessions_current_node_id_fkey"
            columns: ["current_node_id"]
            isOneToOne: false
            referencedRelation: "flow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_flow_sessions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "conversation_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_flows: {
        Row: {
          ativo: boolean
          canal: Database["public"]["Enums"]["canal_type"] | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          instancia_id: string | null
          nome: string
          published_at: string | null
          setor: Database["public"]["Enums"]["setor_type"] | null
          status: Database["public"]["Enums"]["flow_status"]
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["flow_trigger_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean
          canal?: Database["public"]["Enums"]["canal_type"] | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          instancia_id?: string | null
          nome: string
          published_at?: string | null
          setor?: Database["public"]["Enums"]["setor_type"] | null
          status?: Database["public"]["Enums"]["flow_status"]
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["flow_trigger_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean
          canal?: Database["public"]["Enums"]["canal_type"] | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          instancia_id?: string | null
          nome?: string
          published_at?: string | null
          setor?: Database["public"]["Enums"]["setor_type"] | null
          status?: Database["public"]["Enums"]["flow_status"]
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["flow_trigger_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_flows_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "zapi_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_user_id: string | null
          canal: Database["public"]["Enums"]["canal_type"]
          created_at: string
          id: string
          oportunidade_id: string | null
          responsavel_id: string
          setor: Database["public"]["Enums"]["setor_type"] | null
          status: Database["public"]["Enums"]["conversation_status"]
          telefone: string | null
          ultima_mensagem_em: string | null
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          canal?: Database["public"]["Enums"]["canal_type"]
          created_at?: string
          id?: string
          oportunidade_id?: string | null
          responsavel_id: string
          setor?: Database["public"]["Enums"]["setor_type"] | null
          status?: Database["public"]["Enums"]["conversation_status"]
          telefone?: string | null
          ultima_mensagem_em?: string | null
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          canal?: Database["public"]["Enums"]["canal_type"]
          created_at?: string
          id?: string
          oportunidade_id?: string | null
          responsavel_id?: string
          setor?: Database["public"]["Enums"]["setor_type"] | null
          status?: Database["public"]["Enums"]["conversation_status"]
          telefone?: string | null
          ultima_mensagem_em?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_edges: {
        Row: {
          condition_type: string | null
          condition_value: string | null
          created_at: string
          flow_id: string
          id: string
          priority_order: number
          source_handle: string | null
          source_node_id: string
          target_node_id: string
        }
        Insert: {
          condition_type?: string | null
          condition_value?: string | null
          created_at?: string
          flow_id: string
          id?: string
          priority_order?: number
          source_handle?: string | null
          source_node_id: string
          target_node_id: string
        }
        Update: {
          condition_type?: string | null
          condition_value?: string | null
          created_at?: string
          flow_id?: string
          id?: string
          priority_order?: number
          source_handle?: string | null
          source_node_id?: string
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_edges_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "conversation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "flow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "flow_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_execution_logs: {
        Row: {
          action: string
          error_message: string | null
          executed_at: string
          flow_id: string
          id: string
          node_id: string | null
          payload: Json
          session_id: string
          status: string
        }
        Insert: {
          action: string
          error_message?: string | null
          executed_at?: string
          flow_id: string
          id?: string
          node_id?: string | null
          payload?: Json
          session_id: string
          status?: string
        }
        Update: {
          action?: string
          error_message?: string | null
          executed_at?: string
          flow_id?: string
          id?: string
          node_id?: string | null
          payload?: Json
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_execution_logs_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "conversation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_execution_logs_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "flow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_execution_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_flow_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_nodes: {
        Row: {
          config: Json
          created_at: string
          flow_id: string
          id: string
          position_x: number
          position_y: number
          title: string
          type: Database["public"]["Enums"]["flow_node_type"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          flow_id: string
          id?: string
          position_x?: number
          position_y?: number
          title?: string
          type: Database["public"]["Enums"]["flow_node_type"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          flow_id?: string
          id?: string
          position_x?: number
          position_y?: number
          title?: string
          type?: Database["public"]["Enums"]["flow_node_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_nodes_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "conversation_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_versions: {
        Row: {
          created_at: string
          created_by: string | null
          flow_id: string
          id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          flow_id: string
          id?: string
          snapshot?: Json
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          flow_id?: string
          id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "flow_versions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "conversation_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      message_queue: {
        Row: {
          attempts: number | null
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number | null
          message_id: string | null
          next_retry_at: string | null
          payload: Json
          queue_type: string
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          message_id?: string | null
          next_retry_at?: string | null
          payload?: Json
          queue_type?: string
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number | null
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          message_id?: string | null
          next_retry_at?: string | null
          payload?: Json
          queue_type?: string
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content_text: string | null
          conversation_id: string
          created_at: string
          delivered_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          external_message_id: string | null
          id: string
          media_filename: string | null
          media_mime_type: string | null
          media_url: string | null
          read_at: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          content_text?: string | null
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          external_message_id?: string | null
          id?: string
          media_filename?: string | null
          media_mime_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          type?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          content_text?: string | null
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          external_message_id?: string | null
          id?: string
          media_filename?: string | null
          media_mime_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_type?: Database["public"]["Enums"]["sender_type"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: {
          aluno_id: string | null
          created_at: string
          etapa: string
          id: string
          motivo_perda: string | null
          notas: string | null
          origem: Database["public"]["Enums"]["origem_type"] | null
          proximo_followup_em: string | null
          responsavel_id: string
          responsavel_interno_id: string | null
          status: Database["public"]["Enums"]["oportunidade_status"]
          temperatura: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string
          etapa?: string
          id?: string
          motivo_perda?: string | null
          notas?: string | null
          origem?: Database["public"]["Enums"]["origem_type"] | null
          proximo_followup_em?: string | null
          responsavel_id: string
          responsavel_interno_id?: string | null
          status?: Database["public"]["Enums"]["oportunidade_status"]
          temperatura?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string
          etapa?: string
          id?: string
          motivo_perda?: string | null
          notas?: string | null
          origem?: Database["public"]["Enums"]["origem_type"] | null
          proximo_followup_em?: string | null
          responsavel_id?: string
          responsavel_interno_id?: string | null
          status?: Database["public"]["Enums"]["oportunidade_status"]
          temperatura?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_final_loss: boolean
          is_final_win: boolean
          key: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_final_loss?: boolean
          is_final_win?: boolean
          key: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_final_loss?: boolean
          is_final_win?: boolean
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: Database["public"]["Enums"]["origem_type"] | null
          tags: string[] | null
          telefone: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          whatsapp: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_type"] | null
          tags?: string[] | null
          telefone: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_type"] | null
          tags?: string[] | null
          telefone?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      scheduled_broadcasts: {
        Row: {
          caption: string | null
          created_at: string | null
          error_count: number | null
          error_message: string | null
          group_phones: string[]
          id: string
          link_description: string | null
          link_image: string | null
          link_title: string | null
          link_url: string | null
          media_url: string | null
          mention_all: boolean | null
          message: string | null
          results: Json | null
          scheduled_at: string
          sent_count: number | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          group_phones: string[]
          id?: string
          link_description?: string | null
          link_image?: string | null
          link_title?: string | null
          link_url?: string | null
          media_url?: string | null
          mention_all?: boolean | null
          message?: string | null
          results?: Json | null
          scheduled_at: string
          sent_count?: number | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          group_phones?: string[]
          id?: string
          link_description?: string | null
          link_image?: string | null
          link_title?: string | null
          link_url?: string | null
          media_url?: string | null
          mention_all?: boolean | null
          message?: string | null
          results?: Json | null
          scheduled_at?: string
          sent_count?: number | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          chave: string
          created_at: string
          descricao: string | null
          id: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          aluno_id: string | null
          completed_at: string | null
          created_at: string
          descricao: string | null
          due_date: string | null
          id: string
          oportunidade_id: string | null
          prioridade: Database["public"]["Enums"]["task_priority"]
          responsavel_id: string | null
          responsavel_interno_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          tipo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          aluno_id?: string | null
          completed_at?: string | null
          created_at?: string
          descricao?: string | null
          due_date?: string | null
          id?: string
          oportunidade_id?: string | null
          prioridade?: Database["public"]["Enums"]["task_priority"]
          responsavel_id?: string | null
          responsavel_interno_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tipo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string | null
          completed_at?: string | null
          created_at?: string
          descricao?: string | null
          due_date?: string | null
          id?: string
          oportunidade_id?: string | null
          prioridade?: Database["public"]["Enums"]["task_priority"]
          responsavel_id?: string | null
          responsavel_interno_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tipo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      user_modules: {
        Row: {
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          external_event_id: string | null
          id: string
          payload: Json
          processed: boolean | null
          provider: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          external_event_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          provider?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          external_event_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          provider?: string
        }
        Relationships: []
      }
      zapi_instances: {
        Row: {
          client_token: string | null
          connected: boolean | null
          created_at: string
          id: string
          instance_id: string
          nome_instancia: string
          phone_number: string | null
          status: string | null
          token: string
          updated_at: string
        }
        Insert: {
          client_token?: string | null
          connected?: boolean | null
          created_at?: string
          id?: string
          instance_id: string
          nome_instancia: string
          phone_number?: string | null
          status?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          client_token?: string | null
          connected?: boolean | null
          created_at?: string
          id?: string
          instance_id?: string
          nome_instancia?: string
          phone_number?: string | null
          status?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "atendente" | "gestor"
      canal_type:
        | "whatsapp"
        | "telefone"
        | "email"
        | "presencial"
        | "site"
        | "instagram"
        | "facebook"
      conversation_status:
        | "nao_lida"
        | "aguardando"
        | "em_atendimento"
        | "resolvida"
        | "arquivada"
      etapa_funil:
        | "novo_lead"
        | "primeiro_contato"
        | "qualificado"
        | "visita_agendada"
        | "proposta_valores"
        | "documentacao"
        | "matricula_fechada"
        | "perdido"
      flow_node_type:
        | "start"
        | "send_message"
        | "question_options"
        | "capture_input"
        | "condition"
        | "route_sector"
        | "assign_agent"
        | "transfer_human"
        | "update_field"
        | "create_task"
        | "end"
      flow_session_status:
        | "running"
        | "paused"
        | "finished"
        | "failed"
        | "transferred"
      flow_status: "draft" | "active" | "inactive"
      flow_trigger_type:
        | "new_conversation"
        | "first_message"
        | "keyword"
        | "no_assignee"
        | "business_hours"
        | "specific_sector"
      message_direction: "inbound" | "outbound"
      message_status: "pending" | "sent" | "delivered" | "read" | "failed"
      message_type:
        | "text"
        | "image"
        | "audio"
        | "video"
        | "document"
        | "sticker"
        | "location"
        | "contact"
      oportunidade_status: "aberta" | "ganha" | "perdida"
      origem_type:
        | "instagram"
        | "indicacao"
        | "google"
        | "site"
        | "panfleto"
        | "facebook"
        | "whatsapp"
        | "outro"
      queue_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "dead_letter"
      sender_type: "responsavel" | "sistema" | "usuario"
      setor_type:
        | "comercial"
        | "secretaria"
        | "financeiro"
        | "pedagogico"
        | "direcao"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      task_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "atendente", "gestor"],
      canal_type: [
        "whatsapp",
        "telefone",
        "email",
        "presencial",
        "site",
        "instagram",
        "facebook",
      ],
      conversation_status: [
        "nao_lida",
        "aguardando",
        "em_atendimento",
        "resolvida",
        "arquivada",
      ],
      etapa_funil: [
        "novo_lead",
        "primeiro_contato",
        "qualificado",
        "visita_agendada",
        "proposta_valores",
        "documentacao",
        "matricula_fechada",
        "perdido",
      ],
      flow_node_type: [
        "start",
        "send_message",
        "question_options",
        "capture_input",
        "condition",
        "route_sector",
        "assign_agent",
        "transfer_human",
        "update_field",
        "create_task",
        "end",
      ],
      flow_session_status: [
        "running",
        "paused",
        "finished",
        "failed",
        "transferred",
      ],
      flow_status: ["draft", "active", "inactive"],
      flow_trigger_type: [
        "new_conversation",
        "first_message",
        "keyword",
        "no_assignee",
        "business_hours",
        "specific_sector",
      ],
      message_direction: ["inbound", "outbound"],
      message_status: ["pending", "sent", "delivered", "read", "failed"],
      message_type: [
        "text",
        "image",
        "audio",
        "video",
        "document",
        "sticker",
        "location",
        "contact",
      ],
      oportunidade_status: ["aberta", "ganha", "perdida"],
      origem_type: [
        "instagram",
        "indicacao",
        "google",
        "site",
        "panfleto",
        "facebook",
        "whatsapp",
        "outro",
      ],
      queue_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "dead_letter",
      ],
      sender_type: ["responsavel", "sistema", "usuario"],
      setor_type: [
        "comercial",
        "secretaria",
        "financeiro",
        "pedagogico",
        "direcao",
      ],
      task_priority: ["baixa", "media", "alta", "urgente"],
      task_status: ["pendente", "em_andamento", "concluida", "cancelada"],
    },
  },
} as const
