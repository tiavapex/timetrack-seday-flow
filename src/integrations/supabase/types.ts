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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ase_colaboradores: {
        Row: {
          alimentacao: boolean
          ase_id: string
          cargo: string | null
          created_at: string
          escala_sim: boolean
          id: string
          matricula: string | null
          nome: string
          numero: number | null
          user_id: string | null
          vt: boolean
        }
        Insert: {
          alimentacao?: boolean
          ase_id: string
          cargo?: string | null
          created_at?: string
          escala_sim?: boolean
          id?: string
          matricula?: string | null
          nome: string
          numero?: number | null
          user_id?: string | null
          vt?: boolean
        }
        Update: {
          alimentacao?: boolean
          ase_id?: string
          cargo?: string | null
          created_at?: string
          escala_sim?: boolean
          id?: string
          matricula?: string | null
          nome?: string
          numero?: number | null
          user_id?: string | null
          vt?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ase_colaboradores_ase_id_fkey"
            columns: ["ase_id"]
            isOneToOne: false
            referencedRelation: "ases"
            referencedColumns: ["id"]
          },
        ]
      }
      ases: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          atividades: string
          centro_custo: string
          cliente: string
          created_at: string
          criado_por: string
          horario_fim: string
          horario_inicio: string
          id: string
          lancado_em: string | null
          lancado_por: string | null
          lider_gestor: string | null
          observacao: string | null
          periodo_data: string
          reprovado_motivo: string | null
          responsavel: string
          setor: string
          setor_outro: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          atividades: string
          centro_custo: string
          cliente: string
          created_at?: string
          criado_por: string
          horario_fim: string
          horario_inicio: string
          id?: string
          lancado_em?: string | null
          lancado_por?: string | null
          lider_gestor?: string | null
          observacao?: string | null
          periodo_data: string
          reprovado_motivo?: string | null
          responsavel: string
          setor: string
          setor_outro?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          atividades?: string
          centro_custo?: string
          cliente?: string
          created_at?: string
          criado_por?: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          lancado_em?: string | null
          lancado_por?: string | null
          lider_gestor?: string | null
          observacao?: string | null
          periodo_data?: string
          reprovado_motivo?: string | null
          responsavel?: string
          setor?: string
          setor_outro?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      avaliacao_competencias_itens: {
        Row: {
          avaliacao_id: string
          competencia: string
          created_at: string
          descricao: string | null
          id: string
          nota: string
          ordem: number
        }
        Insert: {
          avaliacao_id: string
          competencia: string
          created_at?: string
          descricao?: string | null
          id?: string
          nota: string
          ordem: number
        }
        Update: {
          avaliacao_id?: string
          competencia?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nota?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_competencias_itens_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes_competencias"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_competencias: {
        Row: {
          area: string | null
          avaliador_id: string
          cargo: string | null
          colaborador_id: string
          created_at: string
          data_admissao: string | null
          data_mobilizacao: string | null
          data_termino: string | null
          id: string
          matricula: string | null
          medida: string
          mobilizacao: boolean
          motivo_nao_mobilizacao: string | null
          nome: string
          observacoes: string
          periodo: string
          secao: string | null
          setor: string | null
          setor_codigo: string | null
          status: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          avaliador_id: string
          cargo?: string | null
          colaborador_id: string
          created_at?: string
          data_admissao?: string | null
          data_mobilizacao?: string | null
          data_termino?: string | null
          id?: string
          matricula?: string | null
          medida: string
          mobilizacao: boolean
          motivo_nao_mobilizacao?: string | null
          nome: string
          observacoes: string
          periodo: string
          secao?: string | null
          setor?: string | null
          setor_codigo?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          avaliador_id?: string
          cargo?: string | null
          colaborador_id?: string
          created_at?: string
          data_admissao?: string | null
          data_mobilizacao?: string | null
          data_termino?: string | null
          id?: string
          matricula?: string | null
          medida?: string
          mobilizacao?: boolean
          motivo_nao_mobilizacao?: string | null
          nome?: string
          observacoes?: string
          periodo?: string
          secao?: string | null
          setor?: string | null
          setor_codigo?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_competencias_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feriados: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
        }
        Insert: {
          created_at?: string
          data: string
          descricao: string
          id?: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
        }
        Relationships: []
      }
      ferias_solicitacoes: {
        Row: {
          abono_data_inicio: string | null
          abono_dias: number | null
          aprovado_em: string | null
          aprovado_por: string | null
          cargo: string | null
          centro_custo: string
          colaborador_nome: string
          created_at: string
          criado_por: string
          data_emissao: string
          data_inicio: string
          dias_descanso: number
          empresa: string | null
          id: string
          lancado_em: string | null
          lancado_erp: boolean
          lancado_por: string | null
          matricula: string | null
          observacao: string | null
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          reprovado_motivo: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abono_data_inicio?: string | null
          abono_dias?: number | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          cargo?: string | null
          centro_custo: string
          colaborador_nome: string
          created_at?: string
          criado_por: string
          data_emissao?: string
          data_inicio: string
          dias_descanso: number
          empresa?: string | null
          id?: string
          lancado_em?: string | null
          lancado_erp?: boolean
          lancado_por?: string | null
          matricula?: string | null
          observacao?: string | null
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          reprovado_motivo?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          abono_data_inicio?: string | null
          abono_dias?: number | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          cargo?: string | null
          centro_custo?: string
          colaborador_nome?: string
          created_at?: string
          criado_por?: string
          data_emissao?: string
          data_inicio?: string
          dias_descanso?: number
          empresa?: string | null
          id?: string
          lancado_em?: string | null
          lancado_erp?: boolean
          lancado_por?: string | null
          matricula?: string | null
          observacao?: string | null
          periodo_aquisitivo_fim?: string
          periodo_aquisitivo_inicio?: string
          reprovado_motivo?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      horas_extras: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          colaborador_nome: string
          created_at: string
          data: string
          empresa: string
          hora_fim: string
          hora_inicio: string
          id: string
          intervalo_minutos: number | null
          lancado_em: string | null
          lancado_erp: boolean
          lancado_por: string | null
          matricula: string | null
          motivo: string
          observacoes: string | null
          setor: string
          status: string
          tipo: string
          total_minutos: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          colaborador_nome: string
          created_at?: string
          data: string
          empresa: string
          hora_fim: string
          hora_inicio: string
          id?: string
          intervalo_minutos?: number | null
          lancado_em?: string | null
          lancado_erp?: boolean
          lancado_por?: string | null
          matricula?: string | null
          motivo: string
          observacoes?: string | null
          setor: string
          status?: string
          tipo?: string
          total_minutos: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          colaborador_nome?: string
          created_at?: string
          data?: string
          empresa?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          intervalo_minutos?: number | null
          lancado_em?: string | null
          lancado_erp?: boolean
          lancado_por?: string | null
          matricula?: string | null
          motivo?: string
          observacoes?: string | null
          setor?: string
          status?: string
          tipo?: string
          total_minutos?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ppo_auditoria_log: {
        Row: {
          acao: string
          criado_em: string
          dados_antes: Json | null
          dados_depois: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          ip: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          criado_em?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          criado_em?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      ppo_avaliacao_itens: {
        Row: {
          apurado_em: string | null
          apurado_por: string | null
          avaliacao_id: string
          created_at: string
          evidencia_descricao: string | null
          evidencia_url: string | null
          fonte_dado: string | null
          id: string
          indicador_id: string
          nota_convertida: number | null
          nota_manual: number | null
          nota_manual_justificativa: string | null
          nota_ponderada: number | null
          observacao: string | null
          peso_aplicado: number | null
          pilar: number
          requisito_minimo_atendido: boolean | null
          updated_at: string
          valor_apurado: number | null
        }
        Insert: {
          apurado_em?: string | null
          apurado_por?: string | null
          avaliacao_id: string
          created_at?: string
          evidencia_descricao?: string | null
          evidencia_url?: string | null
          fonte_dado?: string | null
          id?: string
          indicador_id: string
          nota_convertida?: number | null
          nota_manual?: number | null
          nota_manual_justificativa?: string | null
          nota_ponderada?: number | null
          observacao?: string | null
          peso_aplicado?: number | null
          pilar?: number
          requisito_minimo_atendido?: boolean | null
          updated_at?: string
          valor_apurado?: number | null
        }
        Update: {
          apurado_em?: string | null
          apurado_por?: string | null
          avaliacao_id?: string
          created_at?: string
          evidencia_descricao?: string | null
          evidencia_url?: string | null
          fonte_dado?: string | null
          id?: string
          indicador_id?: string
          nota_convertida?: number | null
          nota_manual?: number | null
          nota_manual_justificativa?: string | null
          nota_ponderada?: number | null
          observacao?: string | null
          peso_aplicado?: number | null
          pilar?: number
          requisito_minimo_atendido?: boolean | null
          updated_at?: string
          valor_apurado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ppo_avaliacao_itens_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ppo_avaliacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_avaliacao_itens_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "ppo_indicadores"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_avaliacoes: {
        Row: {
          analise_rh: string | null
          analise_rh_em: string | null
          analise_rh_por: string | null
          ativo: boolean
          cargo_id: string | null
          ciclo_id: string
          colaborador_ciente: boolean
          colaborador_ciente_em: string | null
          colaborador_id: string
          comunicado_em: string | null
          created_at: string
          created_by: string | null
          eleg_cargo_contemplado: boolean
          eleg_evidencias_suficientes: boolean
          eleg_indicadores_definidos: boolean
          eleg_periodo_suficiente: boolean
          eleg_requisitos_seguranca: boolean
          eleg_vinculo: boolean
          elegivel: boolean
          encerrado_em: string | null
          faixa: string | null
          fator_proporcional: number | null
          gestor_id: string | null
          id: string
          motivo_inelegibilidade: string | null
          nota_final: number | null
          nota_p1: number | null
          nota_p2: number | null
          nota_p3: number | null
          nota_p4: number | null
          observacao_nao_reconhecimento: string | null
          percentual_referencia: number | null
          proporcional: boolean
          proporcional_motivo: string | null
          requisito_ocupacional_atendido: boolean | null
          setor_id: string | null
          status: string
          updated_at: string
          validado_em: string | null
          validado_por: string | null
          valor_base: number | null
        }
        Insert: {
          analise_rh?: string | null
          analise_rh_em?: string | null
          analise_rh_por?: string | null
          ativo?: boolean
          cargo_id?: string | null
          ciclo_id: string
          colaborador_ciente?: boolean
          colaborador_ciente_em?: string | null
          colaborador_id: string
          comunicado_em?: string | null
          created_at?: string
          created_by?: string | null
          eleg_cargo_contemplado?: boolean
          eleg_evidencias_suficientes?: boolean
          eleg_indicadores_definidos?: boolean
          eleg_periodo_suficiente?: boolean
          eleg_requisitos_seguranca?: boolean
          eleg_vinculo?: boolean
          elegivel?: boolean
          encerrado_em?: string | null
          faixa?: string | null
          fator_proporcional?: number | null
          gestor_id?: string | null
          id?: string
          motivo_inelegibilidade?: string | null
          nota_final?: number | null
          nota_p1?: number | null
          nota_p2?: number | null
          nota_p3?: number | null
          nota_p4?: number | null
          observacao_nao_reconhecimento?: string | null
          percentual_referencia?: number | null
          proporcional?: boolean
          proporcional_motivo?: string | null
          requisito_ocupacional_atendido?: boolean | null
          setor_id?: string | null
          status?: string
          updated_at?: string
          validado_em?: string | null
          validado_por?: string | null
          valor_base?: number | null
        }
        Update: {
          analise_rh?: string | null
          analise_rh_em?: string | null
          analise_rh_por?: string | null
          ativo?: boolean
          cargo_id?: string | null
          ciclo_id?: string
          colaborador_ciente?: boolean
          colaborador_ciente_em?: string | null
          colaborador_id?: string
          comunicado_em?: string | null
          created_at?: string
          created_by?: string | null
          eleg_cargo_contemplado?: boolean
          eleg_evidencias_suficientes?: boolean
          eleg_indicadores_definidos?: boolean
          eleg_periodo_suficiente?: boolean
          eleg_requisitos_seguranca?: boolean
          eleg_vinculo?: boolean
          elegivel?: boolean
          encerrado_em?: string | null
          faixa?: string | null
          fator_proporcional?: number | null
          gestor_id?: string | null
          id?: string
          motivo_inelegibilidade?: string | null
          nota_final?: number | null
          nota_p1?: number | null
          nota_p2?: number | null
          nota_p3?: number | null
          nota_p4?: number | null
          observacao_nao_reconhecimento?: string | null
          percentual_referencia?: number | null
          proporcional?: boolean
          proporcional_motivo?: string | null
          requisito_ocupacional_atendido?: boolean | null
          setor_id?: string | null
          status?: string
          updated_at?: string
          validado_em?: string | null
          validado_por?: string | null
          valor_base?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ppo_avaliacoes_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "ppo_cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_avaliacoes_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ppo_ciclos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_avaliacoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_avaliacoes_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_avaliacoes_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "ppo_setores"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_barreiras: {
        Row: {
          analise: string | null
          aprovado_em: string | null
          aprovado_por: string | null
          avaliacao_id: string
          created_at: string
          created_by: string | null
          descricao: string
          evidencia_url: string | null
          id: string
          tipo_barreira: string
          updated_at: string
        }
        Insert: {
          analise?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          avaliacao_id: string
          created_at?: string
          created_by?: string | null
          descricao: string
          evidencia_url?: string | null
          id?: string
          tipo_barreira: string
          updated_at?: string
        }
        Update: {
          analise?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          avaliacao_id?: string
          created_at?: string
          created_by?: string | null
          descricao?: string
          evidencia_url?: string | null
          id?: string
          tipo_barreira?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_barreiras_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ppo_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_cargos: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          id: string
          nome: string
          setor_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          setor_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          setor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_cargos_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "ppo_setores"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_ciclos: {
        Row: {
          ano: number
          created_at: string
          created_by: string | null
          data_corte: string | null
          id: string
          nome: string
          observacoes: string | null
          periodo_fim: string
          periodo_inicio: string
          status: string
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          created_by?: string | null
          data_corte?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          periodo_fim: string
          periodo_inicio: string
          status?: string
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          created_by?: string | null
          data_corte?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ppo_contestacoes: {
        Row: {
          aberta_em: string
          analisado_em: string | null
          analisado_por: string | null
          analise: string | null
          avaliacao_id: string
          created_at: string
          created_by: string | null
          decisao: string | null
          evidencia_url: string | null
          fora_do_prazo: boolean
          id: string
          indicador_id: string | null
          justificativa: string | null
          motivo: string
          nota_anterior: number | null
          nota_nova: number | null
          override_rh_justificativa: string | null
          prazo_limite: string | null
          resultado_contestado: string | null
          solicitacao_revisao: string | null
          updated_at: string
        }
        Insert: {
          aberta_em?: string
          analisado_em?: string | null
          analisado_por?: string | null
          analise?: string | null
          avaliacao_id: string
          created_at?: string
          created_by?: string | null
          decisao?: string | null
          evidencia_url?: string | null
          fora_do_prazo?: boolean
          id?: string
          indicador_id?: string | null
          justificativa?: string | null
          motivo: string
          nota_anterior?: number | null
          nota_nova?: number | null
          override_rh_justificativa?: string | null
          prazo_limite?: string | null
          resultado_contestado?: string | null
          solicitacao_revisao?: string | null
          updated_at?: string
        }
        Update: {
          aberta_em?: string
          analisado_em?: string | null
          analisado_por?: string | null
          analise?: string | null
          avaliacao_id?: string
          created_at?: string
          created_by?: string | null
          decisao?: string | null
          evidencia_url?: string | null
          fora_do_prazo?: boolean
          id?: string
          indicador_id?: string | null
          justificativa?: string | null
          motivo?: string
          nota_anterior?: number | null
          nota_nova?: number | null
          override_rh_justificativa?: string | null
          prazo_limite?: string | null
          resultado_contestado?: string | null
          solicitacao_revisao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_contestacoes_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ppo_avaliacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_contestacoes_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "ppo_indicadores"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_faixas_indicador: {
        Row: {
          created_at: string
          id: string
          indicador_id: string
          limite_inferior: number | null
          limite_superior: number | null
          nota: number
          ordem: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          indicador_id: string
          limite_inferior?: number | null
          limite_superior?: number | null
          nota: number
          ordem?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          indicador_id?: string
          limite_inferior?: number | null
          limite_superior?: number | null
          nota?: number
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_faixas_indicador_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "ppo_indicadores"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_feedbacks: {
        Row: {
          avaliacao_id: string
          ciente_colaborador: boolean
          ciente_em: string | null
          ciente_gestor: boolean
          ciente_gestor_em: string | null
          ciente_ip: string | null
          created_at: string
          created_by: string | null
          expectativas: string | null
          gestor_id: string | null
          id: string
          indicadores_destaque: string | null
          oportunidades: string | null
          pontos_positivos: string | null
          realizado_em: string
          updated_at: string
        }
        Insert: {
          avaliacao_id: string
          ciente_colaborador?: boolean
          ciente_em?: string | null
          ciente_gestor?: boolean
          ciente_gestor_em?: string | null
          ciente_ip?: string | null
          created_at?: string
          created_by?: string | null
          expectativas?: string | null
          gestor_id?: string | null
          id?: string
          indicadores_destaque?: string | null
          oportunidades?: string | null
          pontos_positivos?: string | null
          realizado_em?: string
          updated_at?: string
        }
        Update: {
          avaliacao_id?: string
          ciente_colaborador?: boolean
          ciente_em?: string | null
          ciente_gestor?: boolean
          ciente_gestor_em?: string | null
          ciente_ip?: string | null
          created_at?: string
          created_by?: string | null
          expectativas?: string | null
          gestor_id?: string | null
          id?: string
          indicadores_destaque?: string | null
          oportunidades?: string | null
          pontos_positivos?: string | null
          realizado_em?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_feedbacks_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ppo_avaliacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_feedbacks_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_governanca: {
        Row: {
          created_at: string
          etapa: string
          id: string
          ordem: number
          registro: string | null
          responsavel_perfil: string
          updated_at: string
          validacao_perfil: string | null
        }
        Insert: {
          created_at?: string
          etapa: string
          id?: string
          ordem?: number
          registro?: string | null
          responsavel_perfil: string
          updated_at?: string
          validacao_perfil?: string | null
        }
        Update: {
          created_at?: string
          etapa?: string
          id?: string
          ordem?: number
          registro?: string | null
          responsavel_perfil?: string
          updated_at?: string
          validacao_perfil?: string | null
        }
        Relationships: []
      }
      ppo_indicadores: {
        Row: {
          ativo: boolean
          cargo_id: string | null
          created_at: string
          created_by: string | null
          critico: boolean
          descricao: string | null
          direcao: string
          fonte_dado: string | null
          formula: string | null
          id: string
          indicador_origem_id: string | null
          meta: number | null
          motivo_alteracao: string | null
          nome: string
          peso: number | null
          pilar: number
          requisito_minimo: boolean
          responsavel_id: string | null
          setor_id: string | null
          unidade: string | null
          updated_at: string
          versao: number
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          ativo?: boolean
          cargo_id?: string | null
          created_at?: string
          created_by?: string | null
          critico?: boolean
          descricao?: string | null
          direcao?: string
          fonte_dado?: string | null
          formula?: string | null
          id?: string
          indicador_origem_id?: string | null
          meta?: number | null
          motivo_alteracao?: string | null
          nome: string
          peso?: number | null
          pilar: number
          requisito_minimo?: boolean
          responsavel_id?: string | null
          setor_id?: string | null
          unidade?: string | null
          updated_at?: string
          versao?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          ativo?: boolean
          cargo_id?: string | null
          created_at?: string
          created_by?: string | null
          critico?: boolean
          descricao?: string | null
          direcao?: string
          fonte_dado?: string | null
          formula?: string | null
          id?: string
          indicador_origem_id?: string | null
          meta?: number | null
          motivo_alteracao?: string | null
          nome?: string
          peso?: number | null
          pilar?: number
          requisito_minimo?: boolean
          responsavel_id?: string | null
          setor_id?: string | null
          unidade?: string | null
          updated_at?: string
          versao?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ppo_indicadores_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "ppo_cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_indicadores_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_indicadores_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "ppo_setores"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_melhorias: {
        Row: {
          avaliacao_id: string | null
          colaborador_id: string | null
          created_at: string
          created_by: string | null
          descricao: string
          encaminhado_melhoria_continua: boolean
          id: string
          resultado: string | null
          status: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          avaliacao_id?: string | null
          colaborador_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao: string
          encaminhado_melhoria_continua?: boolean
          id?: string
          resultado?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          avaliacao_id?: string | null
          colaborador_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string
          encaminhado_melhoria_continua?: boolean
          id?: string
          resultado?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_melhorias_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ppo_avaliacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_melhorias_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_ocorrencias: {
        Row: {
          analise_lideranca: string | null
          avaliacao_id: string | null
          ciclo_id: string | null
          colaborador_id: string
          created_at: string
          created_by: string | null
          data_ocorrencia: string
          decidido_em: string | null
          decidido_por: string | null
          decisao: string | null
          descricao: string
          evidencia_url: string | null
          id: string
          impacta_nota: boolean
          indicador_impactado_id: string | null
          manifestacao_colaborador: string | null
          manifestacao_em: string | null
          prazo_manifestacao: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          analise_lideranca?: string | null
          avaliacao_id?: string | null
          ciclo_id?: string | null
          colaborador_id: string
          created_at?: string
          created_by?: string | null
          data_ocorrencia?: string
          decidido_em?: string | null
          decidido_por?: string | null
          decisao?: string | null
          descricao: string
          evidencia_url?: string | null
          id?: string
          impacta_nota?: boolean
          indicador_impactado_id?: string | null
          manifestacao_colaborador?: string | null
          manifestacao_em?: string | null
          prazo_manifestacao?: string | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          analise_lideranca?: string | null
          avaliacao_id?: string | null
          ciclo_id?: string | null
          colaborador_id?: string
          created_at?: string
          created_by?: string | null
          data_ocorrencia?: string
          decidido_em?: string | null
          decidido_por?: string | null
          decisao?: string | null
          descricao?: string
          evidencia_url?: string | null
          id?: string
          impacta_nota?: boolean
          indicador_impactado_id?: string | null
          manifestacao_colaborador?: string | null
          manifestacao_em?: string | null
          prazo_manifestacao?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_ocorrencias_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ppo_avaliacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_ocorrencias_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ppo_ciclos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_ocorrencias_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_ocorrencias_indicador_impactado_id_fkey"
            columns: ["indicador_impactado_id"]
            isOneToOne: false
            referencedRelation: "ppo_indicadores"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_operacional_avaliacoes: {
        Row: {
          created_at: string
          criado_por: string
          empresa: string | null
          id: string
          observacao: string | null
          periodo_fim: string
          periodo_inicio: string
          pilar: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          empresa?: string | null
          id?: string
          observacao?: string | null
          periodo_fim: string
          periodo_inicio: string
          pilar: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          empresa?: string | null
          id?: string
          observacao?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          pilar?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      ppo_operacional_itens: {
        Row: {
          created_at: string
          criterios: Json
          funcao: string | null
          id: string
          matricula: string | null
          nome: string
          observacao: string | null
          ordem: number
          ppo_id: string
          total: number | null
        }
        Insert: {
          created_at?: string
          criterios?: Json
          funcao?: string | null
          id?: string
          matricula?: string | null
          nome: string
          observacao?: string | null
          ordem?: number
          ppo_id: string
          total?: number | null
        }
        Update: {
          created_at?: string
          criterios?: Json
          funcao?: string | null
          id?: string
          matricula?: string | null
          nome?: string
          observacao?: string | null
          ordem?: number
          ppo_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ppo_itens_ppo_id_fkey"
            columns: ["ppo_id"]
            isOneToOne: false
            referencedRelation: "ppo_operacional_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_pesos_pilar: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          cargo_id: string | null
          ciclo_id: string | null
          created_at: string
          created_by: string | null
          id: string
          justificativa: string | null
          p1: number
          p2: number
          p3: number
          p4: number
          padrao: boolean
          setor_id: string | null
          updated_at: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          cargo_id?: string | null
          ciclo_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          justificativa?: string | null
          p1?: number
          p2?: number
          p3?: number
          p4?: number
          padrao?: boolean
          setor_id?: string | null
          updated_at?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          cargo_id?: string | null
          ciclo_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          justificativa?: string | null
          p1?: number
          p2?: number
          p3?: number
          p4?: number
          padrao?: boolean
          setor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_pesos_pilar_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "ppo_cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_pesos_pilar_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ppo_ciclos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_pesos_pilar_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "ppo_setores"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_plano_acao: {
        Row: {
          acao: string
          created_at: string
          feedback_id: string
          id: string
          prazo: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          status: string
          updated_at: string
        }
        Insert: {
          acao: string
          created_at?: string
          feedback_id: string
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          acao?: string
          created_at?: string
          feedback_id?: string
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_plano_acao_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "ppo_feedbacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_plano_acao_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_setores: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      ppo_sla: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          id: string
          indicador_id: string | null
          indicador_texto: string | null
          processo: string
          setor_id: string | null
          setor_nome: string | null
          sla_unidade: string | null
          sla_valor: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          indicador_id?: string | null
          indicador_texto?: string | null
          processo: string
          setor_id?: string | null
          setor_nome?: string | null
          sla_unidade?: string | null
          sla_valor: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          indicador_id?: string | null
          indicador_texto?: string | null
          processo?: string
          setor_id?: string | null
          setor_nome?: string | null
          sla_unidade?: string | null
          sla_valor?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_sla_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "ppo_indicadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_sla_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "ppo_setores"
            referencedColumns: ["id"]
          },
        ]
      }
      ppo_termos_ciencia: {
        Row: {
          aceito_em: string
          ciclo_id: string
          colaborador_id: string
          created_at: string
          id: string
          ip: string | null
          texto_versao: string
          updated_at: string
        }
        Insert: {
          aceito_em?: string
          ciclo_id: string
          colaborador_id: string
          created_at?: string
          id?: string
          ip?: string | null
          texto_versao?: string
          updated_at?: string
        }
        Update: {
          aceito_em?: string
          ciclo_id?: string
          colaborador_id?: string
          created_at?: string
          id?: string
          ip?: string | null
          texto_versao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppo_termos_ciencia_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ppo_ciclos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppo_termos_ciencia_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: string | null
          ativo: boolean | null
          cargo: string | null
          cliente: string | null
          created_at: string
          data_admissao: string | null
          depto: string | null
          email: string
          empresa: string | null
          funcao_completa: string | null
          id: string
          matricula: string | null
          nome: string
          secao_codigo: string | null
          secao_desc: string | null
          setor: string | null
          setor_codigo: string | null
          setor_desc: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area?: string | null
          ativo?: boolean | null
          cargo?: string | null
          cliente?: string | null
          created_at?: string
          data_admissao?: string | null
          depto?: string | null
          email: string
          empresa?: string | null
          funcao_completa?: string | null
          id?: string
          matricula?: string | null
          nome: string
          secao_codigo?: string | null
          secao_desc?: string | null
          setor?: string | null
          setor_codigo?: string | null
          setor_desc?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area?: string | null
          ativo?: boolean | null
          cargo?: string | null
          cliente?: string | null
          created_at?: string
          data_admissao?: string | null
          depto?: string | null
          email?: string
          empresa?: string | null
          funcao_completa?: string | null
          id?: string
          matricula?: string | null
          nome?: string
          secao_codigo?: string | null
          secao_desc?: string | null
          setor?: string | null
          setor_codigo?: string | null
          setor_desc?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      qp_solicitacoes: {
        Row: {
          aprov_administrativo: string | null
          aprov_administrativo_data: string | null
          aprov_diretoria: string | null
          aprov_diretoria_data: string | null
          aprov_encarregado: string | null
          aprov_encarregado_data: string | null
          aprov_responsavel: string | null
          aprov_responsavel_data: string | null
          area: string | null
          ben_ad_funcao: boolean
          ben_ad_funcao_valor: string | null
          ben_obs: string | null
          ben_outro: string | null
          ben_plano_odonto: boolean
          ben_plano_saude: boolean
          ben_plano_saude_fob: string | null
          ben_ppo: boolean
          ben_ppo_valor: string | null
          ben_va_vr: string | null
          ben_va_vr_ativo: boolean
          ben_va_vr_valor: string | null
          ben_vt: boolean
          ben_vt_valor: string | null
          cargo: string | null
          created_at: string
          criado_por: string
          data_admissao: string | null
          data_entrega: string | null
          data_evento: string
          data_exame_admissional: string | null
          data_necessidade_admissao: string | null
          empresa: string
          id: string
          indicado_por: string | null
          matricula: string | null
          motivo: string
          nome: string
          observacoes: string | null
          rec_aprovado: boolean
          rec_curriculo: boolean
          rec_cursos: boolean
          rec_outros: boolean
          rec_reprovado: boolean
          rec_treinamento: boolean
          salario: string | null
          status: string
          tempo_experiencia: string | null
          tp_abono: boolean
          tp_acerto_ponto: boolean
          tp_admissao: boolean
          tp_advertencia: boolean
          tp_compensacao: boolean
          tp_demissao: boolean
          tp_folga: boolean
          tp_reembolso: boolean
          tp_troca: boolean
          unif_botina: string | null
          unif_calca: string | null
          unif_camisa: string | null
          unif_capa_chuva: string | null
          unif_jaqueta: string | null
          updated_at: string
        }
        Insert: {
          aprov_administrativo?: string | null
          aprov_administrativo_data?: string | null
          aprov_diretoria?: string | null
          aprov_diretoria_data?: string | null
          aprov_encarregado?: string | null
          aprov_encarregado_data?: string | null
          aprov_responsavel?: string | null
          aprov_responsavel_data?: string | null
          area?: string | null
          ben_ad_funcao?: boolean
          ben_ad_funcao_valor?: string | null
          ben_obs?: string | null
          ben_outro?: string | null
          ben_plano_odonto?: boolean
          ben_plano_saude?: boolean
          ben_plano_saude_fob?: string | null
          ben_ppo?: boolean
          ben_ppo_valor?: string | null
          ben_va_vr?: string | null
          ben_va_vr_ativo?: boolean
          ben_va_vr_valor?: string | null
          ben_vt?: boolean
          ben_vt_valor?: string | null
          cargo?: string | null
          created_at?: string
          criado_por: string
          data_admissao?: string | null
          data_entrega?: string | null
          data_evento?: string
          data_exame_admissional?: string | null
          data_necessidade_admissao?: string | null
          empresa?: string
          id?: string
          indicado_por?: string | null
          matricula?: string | null
          motivo: string
          nome: string
          observacoes?: string | null
          rec_aprovado?: boolean
          rec_curriculo?: boolean
          rec_cursos?: boolean
          rec_outros?: boolean
          rec_reprovado?: boolean
          rec_treinamento?: boolean
          salario?: string | null
          status?: string
          tempo_experiencia?: string | null
          tp_abono?: boolean
          tp_acerto_ponto?: boolean
          tp_admissao?: boolean
          tp_advertencia?: boolean
          tp_compensacao?: boolean
          tp_demissao?: boolean
          tp_folga?: boolean
          tp_reembolso?: boolean
          tp_troca?: boolean
          unif_botina?: string | null
          unif_calca?: string | null
          unif_camisa?: string | null
          unif_capa_chuva?: string | null
          unif_jaqueta?: string | null
          updated_at?: string
        }
        Update: {
          aprov_administrativo?: string | null
          aprov_administrativo_data?: string | null
          aprov_diretoria?: string | null
          aprov_diretoria_data?: string | null
          aprov_encarregado?: string | null
          aprov_encarregado_data?: string | null
          aprov_responsavel?: string | null
          aprov_responsavel_data?: string | null
          area?: string | null
          ben_ad_funcao?: boolean
          ben_ad_funcao_valor?: string | null
          ben_obs?: string | null
          ben_outro?: string | null
          ben_plano_odonto?: boolean
          ben_plano_saude?: boolean
          ben_plano_saude_fob?: string | null
          ben_ppo?: boolean
          ben_ppo_valor?: string | null
          ben_va_vr?: string | null
          ben_va_vr_ativo?: boolean
          ben_va_vr_valor?: string | null
          ben_vt?: boolean
          ben_vt_valor?: string | null
          cargo?: string | null
          created_at?: string
          criado_por?: string
          data_admissao?: string | null
          data_entrega?: string | null
          data_evento?: string
          data_exame_admissional?: string | null
          data_necessidade_admissao?: string | null
          empresa?: string
          id?: string
          indicado_por?: string | null
          matricula?: string | null
          motivo?: string
          nome?: string
          observacoes?: string | null
          rec_aprovado?: boolean
          rec_curriculo?: boolean
          rec_cursos?: boolean
          rec_outros?: boolean
          rec_reprovado?: boolean
          rec_treinamento?: boolean
          salario?: string | null
          status?: string
          tempo_experiencia?: string | null
          tp_abono?: boolean
          tp_acerto_ponto?: boolean
          tp_admissao?: boolean
          tp_advertencia?: boolean
          tp_compensacao?: boolean
          tp_demissao?: boolean
          tp_folga?: boolean
          tp_reembolso?: boolean
          tp_troca?: boolean
          unif_botina?: string | null
          unif_calca?: string | null
          unif_camisa?: string | null
          unif_capa_chuva?: string | null
          unif_jaqueta?: string | null
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vaga_candidatos: {
        Row: {
          created_at: string
          criado_por: string
          data_efetivacao: string | null
          data_encaminhamento_exame: string | null
          data_entrevista: string | null
          data_envio_documentos: string | null
          data_solicitacao_documentos: string | null
          id: string
          nome: string
          observacao: string | null
          status: string | null
          substituicao_de: string | null
          updated_at: string
          vaga_id: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          data_efetivacao?: string | null
          data_encaminhamento_exame?: string | null
          data_entrevista?: string | null
          data_envio_documentos?: string | null
          data_solicitacao_documentos?: string | null
          id?: string
          nome: string
          observacao?: string | null
          status?: string | null
          substituicao_de?: string | null
          updated_at?: string
          vaga_id: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          data_efetivacao?: string | null
          data_encaminhamento_exame?: string | null
          data_entrevista?: string | null
          data_envio_documentos?: string | null
          data_solicitacao_documentos?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          status?: string | null
          substituicao_de?: string | null
          updated_at?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaga_candidatos_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      vaga_curriculos: {
        Row: {
          candidato_nome: string
          created_at: string
          criado_por: string
          data_entrevista: string | null
          enviado_gestor_em: string
          id: string
          observacao: string | null
          retorno_gestor_em: string | null
          retorno_gestor_texto: string | null
          updated_at: string
          vaga_id: string
        }
        Insert: {
          candidato_nome: string
          created_at?: string
          criado_por: string
          data_entrevista?: string | null
          enviado_gestor_em?: string
          id?: string
          observacao?: string | null
          retorno_gestor_em?: string | null
          retorno_gestor_texto?: string | null
          updated_at?: string
          vaga_id: string
        }
        Update: {
          candidato_nome?: string
          created_at?: string
          criado_por?: string
          data_entrevista?: string | null
          enviado_gestor_em?: string
          id?: string
          observacao?: string | null
          retorno_gestor_em?: string | null
          retorno_gestor_texto?: string | null
          updated_at?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaga_curriculos_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas: {
        Row: {
          alinhada_descricao_funcao: boolean | null
          alt_banco_talentos: boolean | null
          alt_na: boolean | null
          alt_promocao: boolean | null
          alt_realocacao: boolean | null
          alt_terceirizacao: boolean | null
          aprov_diretor_presidente: string | null
          aprov_diretoria: string | null
          aprov_gestor_processo: string | null
          aprov_gestor_rh: string | null
          area_departamento: string
          area_setor: string | null
          atividades_realizadas: string | null
          beneficios: string | null
          cargo_solicitado: string
          cargo_substituido: string | null
          centro_custo: string | null
          cnh: string | null
          comunicacao_areas: string | null
          created_at: string
          criado_por: string
          cursos_ferramentas: string | null
          data_abertura: string | null
          data_admissao: string | null
          data_aprovacao: string | null
          data_comunicacao: string | null
          data_fechamento: string | null
          data_solicitacao: string
          disp_mudanca: string | null
          disp_viagens: string | null
          escala_trabalho: string | null
          escolaridade: string | null
          experiencia_necessaria: string | null
          faixa_salarial: string | null
          fonte_recrutamento: string | null
          formacao: string | null
          id: string
          idiomas: string | null
          impacto_nao_preenchida: string | null
          informatica: string | null
          justificativa_sem_alternativa: string | null
          local_trabalho: string | null
          motivo_necessidade: string | null
          motivo_substituicao: string | null
          numero: number
          numero_vagas: number
          observacoes_particularidades: string | null
          observacoes_rh: string | null
          prazo_atendimento: string | null
          recursos_financeiro: string | null
          recursos_infraestrutura: string | null
          recursos_logistica: string | null
          recursos_sst: string | null
          recursos_ti: string | null
          regime_contratacao: string | null
          registro_profissional: string | null
          reporta_se_a: string | null
          residir_regiao: string | null
          responsavel_recrutamento: string | null
          soft_skills: string | null
          solicitante_cargo: string | null
          solicitante_contato: string | null
          solicitante_nome: string
          status: string
          tempo_experiencia: string | null
          tipo_vaga: string
          unidade: string
          updated_at: string
          vaga_sigilosa: boolean
        }
        Insert: {
          alinhada_descricao_funcao?: boolean | null
          alt_banco_talentos?: boolean | null
          alt_na?: boolean | null
          alt_promocao?: boolean | null
          alt_realocacao?: boolean | null
          alt_terceirizacao?: boolean | null
          aprov_diretor_presidente?: string | null
          aprov_diretoria?: string | null
          aprov_gestor_processo?: string | null
          aprov_gestor_rh?: string | null
          area_departamento: string
          area_setor?: string | null
          atividades_realizadas?: string | null
          beneficios?: string | null
          cargo_solicitado: string
          cargo_substituido?: string | null
          centro_custo?: string | null
          cnh?: string | null
          comunicacao_areas?: string | null
          created_at?: string
          criado_por: string
          cursos_ferramentas?: string | null
          data_abertura?: string | null
          data_admissao?: string | null
          data_aprovacao?: string | null
          data_comunicacao?: string | null
          data_fechamento?: string | null
          data_solicitacao?: string
          disp_mudanca?: string | null
          disp_viagens?: string | null
          escala_trabalho?: string | null
          escolaridade?: string | null
          experiencia_necessaria?: string | null
          faixa_salarial?: string | null
          fonte_recrutamento?: string | null
          formacao?: string | null
          id?: string
          idiomas?: string | null
          impacto_nao_preenchida?: string | null
          informatica?: string | null
          justificativa_sem_alternativa?: string | null
          local_trabalho?: string | null
          motivo_necessidade?: string | null
          motivo_substituicao?: string | null
          numero?: number
          numero_vagas?: number
          observacoes_particularidades?: string | null
          observacoes_rh?: string | null
          prazo_atendimento?: string | null
          recursos_financeiro?: string | null
          recursos_infraestrutura?: string | null
          recursos_logistica?: string | null
          recursos_sst?: string | null
          recursos_ti?: string | null
          regime_contratacao?: string | null
          registro_profissional?: string | null
          reporta_se_a?: string | null
          residir_regiao?: string | null
          responsavel_recrutamento?: string | null
          soft_skills?: string | null
          solicitante_cargo?: string | null
          solicitante_contato?: string | null
          solicitante_nome: string
          status?: string
          tempo_experiencia?: string | null
          tipo_vaga: string
          unidade: string
          updated_at?: string
          vaga_sigilosa?: boolean
        }
        Update: {
          alinhada_descricao_funcao?: boolean | null
          alt_banco_talentos?: boolean | null
          alt_na?: boolean | null
          alt_promocao?: boolean | null
          alt_realocacao?: boolean | null
          alt_terceirizacao?: boolean | null
          aprov_diretor_presidente?: string | null
          aprov_diretoria?: string | null
          aprov_gestor_processo?: string | null
          aprov_gestor_rh?: string | null
          area_departamento?: string
          area_setor?: string | null
          atividades_realizadas?: string | null
          beneficios?: string | null
          cargo_solicitado?: string
          cargo_substituido?: string | null
          centro_custo?: string | null
          cnh?: string | null
          comunicacao_areas?: string | null
          created_at?: string
          criado_por?: string
          cursos_ferramentas?: string | null
          data_abertura?: string | null
          data_admissao?: string | null
          data_aprovacao?: string | null
          data_comunicacao?: string | null
          data_fechamento?: string | null
          data_solicitacao?: string
          disp_mudanca?: string | null
          disp_viagens?: string | null
          escala_trabalho?: string | null
          escolaridade?: string | null
          experiencia_necessaria?: string | null
          faixa_salarial?: string | null
          fonte_recrutamento?: string | null
          formacao?: string | null
          id?: string
          idiomas?: string | null
          impacto_nao_preenchida?: string | null
          informatica?: string | null
          justificativa_sem_alternativa?: string | null
          local_trabalho?: string | null
          motivo_necessidade?: string | null
          motivo_substituicao?: string | null
          numero?: number
          numero_vagas?: number
          observacoes_particularidades?: string | null
          observacoes_rh?: string | null
          prazo_atendimento?: string | null
          recursos_financeiro?: string | null
          recursos_infraestrutura?: string | null
          recursos_logistica?: string | null
          recursos_sst?: string | null
          recursos_ti?: string | null
          regime_contratacao?: string | null
          registro_profissional?: string | null
          reporta_se_a?: string | null
          residir_regiao?: string | null
          responsavel_recrutamento?: string | null
          soft_skills?: string | null
          solicitante_cargo?: string | null
          solicitante_contato?: string | null
          solicitante_nome?: string
          status?: string
          tempo_experiencia?: string | null
          tipo_vaga?: string
          unidade?: string
          updated_at?: string
          vaga_sigilosa?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      gold_colaboradores: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          data_admissao: string | null
          data_demissao: string | null
          email: string | null
          gestor_id: string | null
          id: string | null
          matricula: string | null
          nome: string | null
          origem_id: string | null
          setor: string | null
          sincronizado_em: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          email?: string | null
          gestor_id?: string | null
          id?: string | null
          matricula?: string | null
          nome?: string | null
          origem_id?: string | null
          setor?: string | null
          sincronizado_em?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          email?: string | null
          gestor_id?: string | null
          id?: string | null
          matricula?: string | null
          nome?: string | null
          origem_id?: string | null
          setor?: string | null
          sincronizado_em?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vw_colaboradores_ativos: {
        Row: {
          cargo: string | null
          data_admissao: string | null
          email: string | null
          gestor_id: string | null
          id: string | null
          matricula: string | null
          nome: string | null
          origem_id: string | null
          setor: string | null
          sincronizado_em: string | null
          user_id: string | null
        }
        Insert: {
          cargo?: string | null
          data_admissao?: string | null
          email?: string | null
          gestor_id?: string | null
          id?: string | null
          matricula?: string | null
          nome?: string | null
          origem_id?: string | null
          setor?: string | null
          sincronizado_em?: string | null
          user_id?: string | null
        }
        Update: {
          cargo?: string | null
          data_admissao?: string | null
          email?: string | null
          gestor_id?: string | null
          id?: string | null
          matricula?: string | null
          nome?: string | null
          origem_id?: string | null
          setor?: string | null
          sincronizado_em?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vw_minha_equipe: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          data_admissao: string | null
          email: string | null
          gestor_id: string | null
          id: string | null
          matricula: string | null
          nome: string | null
          origem_id: string | null
          setor: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          data_admissao?: string | null
          email?: string | null
          gestor_id?: string | null
          id?: string | null
          matricula?: string | null
          nome?: string | null
          origem_id?: string | null
          setor?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          data_admissao?: string | null
          email?: string | null
          gestor_id?: string | null
          id?: string | null
          matricula?: string | null
          nome?: string | null
          origem_id?: string | null
          setor?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vw_sync_status: {
        Row: {
          entity: string | null
          error_message: string | null
          extracted_at: string | null
          finished_at: string | null
          id: string | null
          rejeitados: number | null
          rows_changed: number | null
          rows_fetched: number | null
          rows_new: number | null
          source: string | null
          started_at: string | null
          status: string | null
          triggered_by: string | null
        }
        Insert: {
          entity?: string | null
          error_message?: string | null
          extracted_at?: string | null
          finished_at?: string | null
          id?: string | null
          rejeitados?: never
          rows_changed?: number | null
          rows_fetched?: number | null
          rows_new?: number | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          triggered_by?: string | null
        }
        Update: {
          entity?: string | null
          error_message?: string | null
          extracted_at?: string | null
          finished_at?: string | null
          id?: string | null
          rejeitados?: never
          rows_changed?: number | null
          rows_fetched?: number | null
          rows_new?: number | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_master_role: { Args: { user_email: string }; Returns: undefined }
      can_approve_ferias: {
        Args: { _approver: string; _solicitante: string }
        Returns: boolean
      }
      fn_calcular_avaliacao: {
        Args: { _avaliacao_id: string }
        Returns: undefined
      }
      fn_converter_nota: {
        Args: { _indicador_id: string; _valor: number }
        Returns: number
      }
      fn_prazo_contestacao: {
        Args: { _data_comunicacao: string; _dias?: number }
        Returns: string
      }
      get_user_max_level: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_higher: { Args: { _user_id: string }; Returns: boolean }
      is_dp_or_higher: { Args: { _user_id: string }; Returns: boolean }
      is_gestor_or_higher: { Args: { _user_id: string }; Returns: boolean }
      ppo_can_admin: { Args: { _user_id: string }; Returns: boolean }
      ppo_can_read_param: { Args: { _user_id: string }; Returns: boolean }
      ppo_is_auditor: { Args: { _user_id: string }; Returns: boolean }
      ppo_is_gerencia: { Args: { _user_id: string }; Returns: boolean }
      ppo_is_gestor_da_avaliacao: {
        Args: { _avaliacao_id: string }
        Returns: boolean
      }
      ppo_is_lideranca: { Args: { _user_id: string }; Returns: boolean }
      ppo_is_owner: { Args: { _colaborador_id: string }; Returns: boolean }
      ppo_is_rh: { Args: { _user_id: string }; Returns: boolean }
      ppo_is_sesmt: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "master"
        | "admin"
        | "gestor"
        | "colaborador"
        | "dp"
        | "lider"
        | "supervisor"
        | "coordenador"
        | "encarregado"
        | "rh"
        | "sesmt"
        | "sgi"
        | "juridico"
        | "diretoria"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "master",
        "admin",
        "gestor",
        "colaborador",
        "dp",
        "lider",
        "supervisor",
        "coordenador",
        "encarregado",
        "rh",
        "sesmt",
        "sgi",
        "juridico",
        "diretoria",
      ],
    },
  },
} as const
