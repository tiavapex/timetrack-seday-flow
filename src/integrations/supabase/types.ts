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
    PostgrestVersion: "14.1"
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
      [_ in never]: never
    }
    Functions: {
      assign_master_role: { Args: { user_email: string }; Returns: undefined }
      can_approve_ferias: {
        Args: { _approver: string; _solicitante: string }
        Returns: boolean
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
      app_role: [
        "master",
        "admin",
        "gestor",
        "colaborador",
        "dp",
        "lider",
        "supervisor",
        "coordenador",
      ],
    },
  },
} as const
