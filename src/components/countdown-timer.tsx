"use client"

import { useEffect, useState } from "react"
import { cn } from "../utils/utils";
import { useTranslations } from "next-intl"

const CountdownTimer = ({ className }: { className?: string }) => {
  const t = useTranslations("GARA.garaDepo.timer")

  // Initial token price
  const initialPrice = 0.12

  // State for time and price
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [price, setPrice] = useState<number>(initialPrice)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPrice = localStorage.getItem("garaPrice")
      setPrice(savedPrice ? parseFloat(savedPrice) : initialPrice)
    }
  }, [])

  // Function to get the next Monday at 00:00:00
  const getNextMondayMidnight = () => {
    const now = new Date()
    let nextMonday = new Date(now)

    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    let daysUntilMonday = (8 - dayOfWeek) % 7 // Ensure Monday is always the next occurrence

    if (daysUntilMonday === 0) {
      daysUntilMonday = 7 // If today is Monday, get next Monday
    }

    nextMonday.setDate(now.getDate() + daysUntilMonday)
    nextMonday.setHours(0, 0, 0, 0)

    return nextMonday.getTime()
  }

  const calculateTimeLeft = () => {
    const now = new Date().getTime()
    const targetDate = getNextMondayMidnight()
    const difference = targetDate - now

    if (difference <= 0) {
      handleReset()
    } else {
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      })
    }
  }

  const handleReset = () => {
    const newPrice = price + 0.01
    setPrice(newPrice)

    if (typeof window !== "undefined") {
      localStorage.setItem("garaPrice", newPrice.toFixed(2))
    }

    // Immediately set next week's time and re-render
    setTimeLeft({
      days: 7,
      hours: 0,
      minutes: 0,
      seconds: 0,
    })
  }

  useEffect(() => {
    calculateTimeLeft() // Initial call
    const timer = setInterval(() => calculateTimeLeft(), 1000)
    return () => clearInterval(timer)
  }, [price])

  return (
    <div className={cn("flex w-full items-center justify-center space-x-2", className)}>
      <div className="flex w-full flex-col items-center rounded-xl bg-gary-blue p-2 font-heading shadow-md">
        <div className="text-3xl font-bold text-gary-yellow">{String(timeLeft.days).padStart(2, "0")}</div>
        <div className="text-xs text-white">{t("day")}</div>
      </div>

      <div className="text-xl font-bold text-secondary">:</div>

      <div className="flex w-full flex-col items-center rounded-xl bg-gary-blue p-2 font-heading shadow-md">
        <div className="text-3xl font-bold text-gary-yellow">{String(timeLeft.hours).padStart(2, "0")}</div>
        <div className="text-xs text-white">{t("hours")}</div>
      </div>

      <div className="text-xl font-bold text-secondary">:</div>

      <div className="flex w-full flex-col items-center rounded-xl bg-gary-blue p-2 font-heading shadow-md">
        <div className="text-3xl font-bold text-gary-yellow">{String(timeLeft.minutes).padStart(2, "0")}</div>
        <div className="text-xs text-white">{t("minutes")}</div>
      </div>

      <div className="text-xl font-bold text-secondary">:</div>

      <div className="flex w-full flex-col items-center rounded-xl bg-gary-blue p-2 font-heading shadow-md">
        <div className="text-3xl font-bold text-gary-yellow">{String(timeLeft.seconds).padStart(2, "0")}</div>
        <div className="text-xs text-white">{t("seconds")}</div>
      </div>
    </div>
  )
}

export default CountdownTimer
