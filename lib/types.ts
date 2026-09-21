export type BeneficioStatus = 'AGUARDANDO_RETIRADA' | 'ENTREGUE';

export type Agricultor = {
  id: string;
  nome_completo: string;
  cpf: string;
  comunidade: string;
  protocolo: string;
  caf_dap?: string | null;
  status: BeneficioStatus;
  data_entrega?: string | null;
};
