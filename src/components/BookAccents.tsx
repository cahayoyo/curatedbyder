import {
  BookOpen,
  Book,
  BookA,
  Armchair,
  Balloon,
  Scroll,
  Sparkles,
  Puzzle,
  ToyBrick,
  Rainbow,
  Cloud,
  Sun,
  Moon,
  Star,
  Crown,
  Gift,
  Rocket,
  Gamepad,
  Palette,
  Pencil,
  Ruler,
  Heart,
  Rabbit,
  Bird,
  Flower,
  Clover,
  School,
  PartyPopper,
  Dices,
} from "lucide-react";

export function BookAccents() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* ==== Books (small + large) ==== */}
      <Book className="absolute left-[4%] top-[10%] h-16 w-16 text-black/15 rotate-[-12deg]" />
      <Book className="absolute left-[9%] top-[21%] h-8 w-8 text-black/10 rotate-[8deg]" />
      <BookA className="absolute left-[15%] top-[12%] h-10 w-10 text-black/10 rotate-[5deg]" />
      <BookOpen className="absolute bottom-[14%] left-[6%] h-14 w-14 text-black/15 rotate-[10deg]" />
      <Book className="absolute bottom-[7%] left-[13%] h-9 w-9 text-black/10 rotate-[-6deg]" />
      <Book className="absolute right-[5%] bottom-[12%] h-12 w-12 text-black/15 rotate-[8deg]" />

      {/* ==== Chair ==== */}
      <Armchair className="absolute right-[7%] top-[16%] h-16 w-16 text-black/15 rotate-[6deg]" />

      {/* ==== Balloons ==== */}
      <Balloon className="absolute right-[15%] top-[8%] h-12 w-12 text-black/10 rotate-[8deg]" />
      <Balloon className="absolute left-[30%] top-[7%] h-9 w-9 text-black/10 rotate-[-10deg]" />

      {/* ==== Paper / scroll ==== */}
      <Scroll className="absolute bottom-[16%] right-[10%] h-14 w-14 text-black/15 rotate-[-10deg]" />
      <Scroll className="absolute left-[22%] bottom-[10%] h-9 w-9 text-black/10 rotate-[14deg]" />

      {/* ==== Toys / games ==== */}
      <ToyBrick className="absolute left-[40%] top-[16%] h-12 w-12 text-black/10 rotate-[5deg]" />
      <Puzzle className="absolute right-[40%] bottom-[13%] h-12 w-12 text-black/10 rotate-[-8deg]" />
      <Dices className="absolute left-[12%] top-[40%] h-10 w-10 text-black/10 rotate-[10deg]" />
      <Gamepad className="absolute right-[3%] top-[38%] h-12 w-12 text-black/10 rotate-[-6deg]" />
      <Rocket className="absolute left-[6%] bottom-[28%] h-12 w-12 text-black/10 rotate-[14deg]" />
      <Crown className="absolute left-[48%] top-[6%] h-10 w-10 text-black/10 rotate-[5deg]" />

      {/* ==== Weather / nature ==== */}
      <Rainbow className="absolute right-[22%] top-[22%] h-12 w-12 text-black/10 rotate-[8deg]" />
      <Cloud className="absolute left-[6%] top-[4%] h-10 w-10 text-black/10" />
      <Sun className="absolute right-[6%] bottom-[4%] h-11 w-11 text-black/10" />
      <Moon className="absolute right-[32%] top-[5%] h-8 w-8 text-black/10" />

      {/* ==== School / creativity ==== */}
      <School className="absolute left-[20%] top-[30%] h-12 w-12 text-black/10 rotate-[-6deg]" />
      <Palette className="absolute right-[28%] bottom-[20%] h-11 w-11 text-black/10 rotate-[12deg]" />
      <Pencil className="absolute left-[32%] bottom-[26%] h-10 w-10 text-black/10 rotate-[-20deg]" />
      <Ruler className="absolute right-[45%] top-[12%] h-10 w-10 text-black/10 rotate-[25deg]" />

      {/* ==== Animals / cute / fun ==== */}
      <Rabbit className="absolute left-[16%] top-[14%] h-9 w-9 text-black/10 rotate-[8deg]" />
      <Bird className="absolute right-[18%] top-[30%] h-9 w-9 text-black/10 rotate-[-8deg]" />
      <Flower className="absolute left-[28%] bottom-[8%] h-10 w-10 text-black/10" />
      <Clover className="absolute right-[34%] bottom-[6%] h-9 w-9 text-black/10 rotate-[15deg]" />
      <Heart className="absolute right-[8%] top-[4%] h-8 w-8 text-black/10 rotate-[-10deg]" />

      {/* ==== Celebration / sparkles / stars ==== */}
      <PartyPopper className="absolute left-[44%] bottom-[6%] h-11 w-11 text-black/10 rotate-[8deg]" />
      <Gift className="absolute right-[48%] top-[26%] h-10 w-10 text-black/10 rotate-[-5deg]" />
      <Sparkles className="absolute left-[22%] top-[8%] h-7 w-7 text-black/10" />
      <Sparkles className="absolute right-[24%] bottom-[10%] h-6 w-6 text-black/10" />
      <Star className="absolute left-[8%] top-[26%] h-7 w-7 text-black/10" />
      <Star className="absolute right-[12%] bottom-[24%] h-6 w-6 text-black/10" />
    </div>
  );
}