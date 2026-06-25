import {
  Anchor,
  Armchair,
  Backpack,
  Barcode,
  Beer,
  Bitcoin,
  Briefcase,
  BusFront,
  Car,
  CarTaxiFront,
  ChartColumn,
  Church,
  CircleDollarSign,
  Clapperboard,
  Coffee,
  CreditCard,
  Dumbbell,
  Gamepad2,
  Gift,
  Goal,
  GraduationCap,
  HeartPulse,
  Home,
  Motorbike,
  Music2,
  PawPrint,
  PiggyBank,
  Plane,
  Popcorn,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  SoapDispenserDroplet,
  Tag,
  TrainFront,
  TrendingDown,
  TvMinimal,
  TvMinimalPlay,
  User,
  UtensilsCrossed,
  Wallet
} from 'lucide-react-native';

export type CategoriaKey =
  | 'scissors'
  | 'soapDispenserDroplet'
  | 'celular'
  | 'home'
  | 'creditcard'
  | 'goal'
  | 'clapperboard'
  | 'chartColumn'
  | 'TvMinimalPlay'
  | 'popcorn'
  | 'tvMinimal'
  | 'trendingDown'
  | 'backpack'
  | 'shoppingBag'
  | 'church'
  | 'clothes'
  | 'market'
  | 'train'
  | 'bus'
  | 'motorbike'
  | 'carTaxiFront'
  | 'joystick'
  | 'music'
  | 'tag'
  | 'money'
  | 'bitcoin'
  | 'coffee'
  | 'armchair'
  | 'barcode'
  | 'beer'
  | 'user'
  | 'anchor'
  | 'pawPrint'
  | 'utensils'
  | 'car'
  | 'shoppingCart'
  | 'health'
  | 'education'
  | 'work'
  | 'travel'
  | 'gym'
  | 'gift'
  | 'savings'
  | 'wallet'

export const CATEGORIA_ICONS: Record<
  CategoriaKey,
  { label: string; Icon: any }
> = {
  scissors: { label: 'Scissors', Icon: Scissors },
  soapDispenserDroplet: { label: 'Higiene', Icon: SoapDispenserDroplet },

  celular: { label: 'Celular', Icon: Smartphone },
  home: { label: 'Casa', Icon: Home },
  creditcard: { label: 'Fatura', Icon: CreditCard },
  goal: { label: 'Metas', Icon: Goal },

  clapperboard: { label: 'Entretenimento', Icon: Clapperboard },
  chartColumn: { label: 'Investimentos', Icon: ChartColumn },
  TvMinimalPlay: { label: 'Streaming', Icon: TvMinimalPlay },
  popcorn: { label: 'Cinema', Icon: Popcorn },
  tvMinimal: { label: 'TV', Icon: TvMinimal },
  trendingDown: { label: 'Crise', Icon: TrendingDown },

  backpack: { label: 'Escola', Icon: Backpack },
  shoppingBag: { label: 'Compras', Icon: ShoppingBag },
  //trophy: { label: 'Esportes', Icon: Trophy },
  church: { label: 'Religião', Icon: Church },
  clothes: { label: 'Roupas', Icon: Shirt },
  market: { label: 'Mercado', Icon: ShoppingBasket },

  train: { label: 'Trem', Icon: TrainFront },
  bus: { label: 'Ônibus', Icon: BusFront },
  motorbike: { label: 'Transporte', Icon: Motorbike },
  carTaxiFront: { label: 'Taxi', Icon: CarTaxiFront },

  joystick: { label: 'Lazer', Icon: Gamepad2 },
  music: { label: 'Música', Icon: Music2 },

  tag: { label: 'Geral', Icon: Tag },
  money: { label: 'Salário', Icon: CircleDollarSign },
  bitcoin: { label: 'Criptomoedas', Icon: Bitcoin },
  coffee: { label: 'Café', Icon: Coffee },

  armchair: { label: 'Lazer', Icon: Armchair },
  barcode: { label: 'Contas', Icon: Barcode },
  beer: { label: 'Lazer', Icon: Beer },

  user: { label: 'Pessoal', Icon: User },
  anchor: { label: 'Outros', Icon: Anchor },
  pawPrint: { label: 'Animais', Icon: PawPrint },

  utensils: { label: 'Alimentação', Icon: UtensilsCrossed },
  car: { label: 'Transporte', Icon: Car },
  shoppingCart: { label: 'Compras', Icon: ShoppingCart },

  health: { label: 'Saúde', Icon: HeartPulse },
  education: { label: 'Educação', Icon: GraduationCap },
  work: { label: 'Trabalho', Icon: Briefcase },
  travel: { label: 'Viagem', Icon: Plane },
  gym: { label: 'Academia', Icon: Dumbbell },

  gift: { label: 'Presentes', Icon: Gift },
  savings: { label: 'Investimentos', Icon: PiggyBank },
  wallet: { label: 'Carteira', Icon: Wallet },
}
