"use client";

import { City } from "@/types/weather";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface CitySelectorProps {
  cities: City[];
  selected: City;
  onChange: (city: City) => void;
}

export default function CitySelector({ cities, selected, onChange }: CitySelectorProps) {
  return (
    <div className="flex gap-2">
      {cities.map((city) => {
        const isSelected = city.name === selected.name;
        return (
          <motion.button
            key={city.name}
            onClick={() => onChange(city)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200",
              isSelected
                ? "bg-white text-slate-900 shadow-lg shadow-white/20"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
            )}
          >
            <MapPin size={14} strokeWidth={2.5} />
            <span>{city.name}</span>
            {isSelected && (
              <span className="text-xs text-slate-500 font-normal hidden sm:inline">
                {city.province}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
