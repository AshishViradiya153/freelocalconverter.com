import { faker } from "@faker-js/faker";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircle2,
  Circle,
  CircleCheck,
  CircleHelp,
  type LucideIcon,
  Timer,
} from "lucide-react";
import { generateId } from "@/lib/id";
import {
  SKATER_STANCES,
  SKATER_STATUSES,
  SKATER_STYLES,
  type Skater,
} from "@/lib/skaters-model";

const availableTricks = [
  "Kickflip",
  "Heelflip",
  "Tre Flip",
  "Hardflip",
  "Varial Flip",
  "360 Flip",
  "Ollie",
  "Nollie",
  "Pop Shove-it",
  "FS Boardslide",
  "BS Boardslide",
  "50-50 Grind",
  "5-0 Grind",
  "Crooked Grind",
  "Smith Grind",
] as const;

const sampleMedia = [
  { name: "trick_clip.mp4", type: "video/mp4", sizeRange: [5000, 50000] },
  { name: "skate_edit.mp4", type: "video/mp4", sizeRange: [10000, 100000] },
  { name: "photo_1.jpg", type: "image/jpeg", sizeRange: [500, 3000] },
  { name: "photo_2.jpg", type: "image/jpeg", sizeRange: [500, 3000] },
  {
    name: "sponsor_contract.pdf",
    type: "application/pdf",
    sizeRange: [100, 500],
  },
] as const;

export function generateRandomSkater(input?: Partial<Skater>): Skater {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  const trickCount = faker.number.int({ min: 0, max: 8 });
  const tricks =
    trickCount > 0
      ? faker.helpers.arrayElements([...availableTricks], trickCount)
      : null;

  const hasMedia = faker.datatype.boolean({ probability: 0.3 });
  const media = hasMedia
    ? faker.helpers
        .arrayElements(sampleMedia, { min: 1, max: 2 })
        .map((file, index) => ({
          id: `media-${generateId("media")}-${index}`,
          name: file.name,
          size:
            faker.number.int({
              min: file.sizeRange[0],
              max: file.sizeRange[1],
            }) * 1024,
          type: file.type,
          url: `https://example.com/media/${file.name}`,
        }))
    : null;

  return {
    id: generateId("skater"),
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    stance: faker.helpers.shuffle([...SKATER_STANCES])[0] ?? "regular",
    style: faker.helpers.shuffle([...SKATER_STYLES])[0] ?? "street",
    status: faker.helpers.shuffle([...SKATER_STATUSES])[0] ?? "amateur",
    yearsSkating: faker.number.int({ min: 1, max: 25 }),
    startedSkating: faker.date.between({
      from: "2000-01-01",
      to: "2023-01-01",
    }),
    isPro: faker.datatype.boolean({ probability: 0.3 }),
    tricks,
    media,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };
}

export function getSkaterStatusIcon(status: Skater["status"]) {
  const statusIcons: Record<Skater["status"], LucideIcon> = {
    amateur: Circle,
    sponsored: Timer,
    pro: CheckCircle2,
    legend: CircleCheck,
  };

  return statusIcons[status];
}

export function getStanceIcon(stance: Skater["stance"]) {
  const stanceIcons: Record<Skater["stance"], LucideIcon> = {
    regular: ArrowRightIcon,
    goofy: ArrowDownIcon,
  };

  return stanceIcons[stance];
}

export function getStyleIcon(style: Skater["style"]) {
  const styleIcons: Record<Skater["style"], LucideIcon> = {
    street: CircleCheck,
    vert: ArrowUpIcon,
    park: Circle,
    freestyle: CircleHelp,
    "all-around": CheckCircle2,
  };

  return styleIcons[style];
}

type ResolutionPreset = {
  name: string;
  width: number;
  height: number;
  category: string;
};

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  {
    name: "16:9",
    width: 1920,
    height: 1080,
    category: "",
  },
  {
    name: "3:2",
    width: 1920,
    height: 1280,
    category: "",
  },
  {
    name: "4:3",
    width: 1920,
    height: 1440,
    category: "",
  },
  {
    name: "5:4",
    width: 1920,
    height: 1536,
    category: "",
  },
  {
    name: "1:1",
    width: 1920,
    height: 1920,
    category: "",
  },
  {
    name: "4:5",
    width: 1080,
    height: 1350,
    category: "",
  },
  {
    name: "3:4",
    width: 1080,
    height: 1440,
    category: "",
  },
  {
    name: "2:3",
    width: 1080,
    height: 1620,
    category: "",
  },
  {
    name: "9:16",
    width: 1080,
    height: 1920,
    category: "",
  },

  // Mobile Devices
  {
    name: "iPhone 15",
    width: 1179,
    height: 2556,
    category: "Mobile Devices",
  },
  {
    name: "iPhone 15 Pro",
    width: 1179,
    height: 2556,
    category: "Mobile Devices",
  },
  {
    name: "iPhone 15 Pro Max",
    width: 1290,
    height: 2796,
    category: "Mobile Devices",
  },
  {
    name: "Android (S)",
    width: 720,
    height: 1520,
    category: "Mobile Devices",
  },
  {
    name: "Android (M)",
    width: 1080,
    height: 2400,
    category: "Mobile Devices",
  },
  {
    name: "Android (L)",
    width: 1440,
    height: 3200,
    category: "Mobile Devices",
  },

  // Tablets
  { name: 'iPad Pro 12.9"', width: 2048, height: 2732, category: "Tablets" },
  { name: "iPad Air", width: 1668, height: 2388, category: "Tablets" },
  { name: "Samsung Tab S7", width: 2560, height: 1600, category: "Tablets" },

  // Desktop & Monitors
  {
    name: "2K (QHD)",
    width: 2560,
    height: 1440,
    category: "Desktop & Monitors",
  },
  {
    name: "Full HD",
    width: 1920,
    height: 1080,
    category: "Desktop & Monitors",
  },
  { name: "4K UHD", width: 3840, height: 2160, category: "Desktop & Monitors" },

  // Use:
  { name: "Open Graph", width: 1200, height: 630, category: "Metadata" },

  // Facebook
  { name: "Story/Reels", width: 1080, height: 1920, category: "Facebook" },
  { name: "Event Cover", width: 1920, height: 1005, category: "Facebook" },

  // Instagram
  { name: "Square Post", width: 1080, height: 1080, category: "Instagram" },
  { name: "Portrait Post", width: 1080, height: 1350, category: "Instagram" },
  { name: "Story/Reels", width: 1080, height: 1920, category: "Instagram" },

  // Twitter
  { name: "Post Image", width: 1600, height: 900, category: "Twitter" },
  { name: "Header", width: 1500, height: 500, category: "Twitter" },

  // LinkedIn
  { name: "Post", width: 1200, height: 627, category: "LinkedIn" },
  { name: "Banner", width: 1584, height: 396, category: "LinkedIn" },
];