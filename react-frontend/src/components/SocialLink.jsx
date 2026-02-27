import {
  BsGithub, BsInstagram, BsLinkedin, BsTwitterX, BsFacebook,
  BsYoutube, BsTiktok, BsDiscord, BsWhatsapp, BsTelegram,
  BsSnapchat, BsPinterest, BsReddit, BsMedium, BsBehance,
  BsDribbble, BsSpotify, BsTwitch,
} from "react-icons/bs";
import { SiGmail, SiStackoverflow, SiCodepen } from "react-icons/si";
import { FaGlobe } from "react-icons/fa";

function getSocialIcon(url, name, size = "md") {
  const sizeClasses = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
  const iconClass = sizeClasses[size];
  if (!url) return <FaGlobe className={iconClass} />;

  const lowercaseUrl = url.toLowerCase();
  const lowercaseName = name.toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(url)) return <SiGmail className={iconClass} />;

  const urlMap = [
    ["github.com", BsGithub], ["linkedin.com", BsLinkedin], ["instagram.com", BsInstagram],
    ["twitter.com", BsTwitterX], ["x.com", BsTwitterX], ["facebook.com", BsFacebook],
    ["youtube.com", BsYoutube], ["youtu.be", BsYoutube], ["tiktok.com", BsTiktok],
    ["discord.com", BsDiscord], ["discord.gg", BsDiscord], ["whatsapp.com", BsWhatsapp],
    ["wa.me", BsWhatsapp], ["telegram.org", BsTelegram], ["t.me", BsTelegram],
    ["snapchat.com", BsSnapchat], ["pinterest.com", BsPinterest], ["reddit.com", BsReddit],
    ["medium.com", BsMedium], ["behance.net", BsBehance], ["dribbble.com", BsDribbble],
    ["spotify.com", BsSpotify], ["twitch.tv", BsTwitch], ["gmail.com", SiGmail],
    ["mailto:", SiGmail], ["stackoverflow.com", SiStackoverflow], ["codepen.io", SiCodepen],
  ];
  for (const [pattern, Icon] of urlMap) {
    if (lowercaseUrl.includes(pattern)) return <Icon className={iconClass} />;
  }

  const nameMap = [
    ["github", BsGithub], ["linkedin", BsLinkedin], ["instagram", BsInstagram],
    ["twitter", BsTwitterX], ["facebook", BsFacebook], ["youtube", BsYoutube],
    ["tiktok", BsTiktok], ["discord", BsDiscord], ["whatsapp", BsWhatsapp],
    ["telegram", BsTelegram], ["snapchat", BsSnapchat], ["pinterest", BsPinterest],
    ["reddit", BsReddit], ["medium", BsMedium], ["behance", BsBehance],
    ["dribbble", BsDribbble], ["spotify", BsSpotify], ["twitch", BsTwitch],
    ["email", SiGmail], ["gmail", SiGmail], ["stackoverflow", SiStackoverflow],
    ["codepen", SiCodepen],
  ];
  for (const [pattern, Icon] of nameMap) {
    if (lowercaseName.includes(pattern)) return <Icon className={iconClass} />;
  }
  return <FaGlobe className={iconClass} />;
}

function formatUrl(url) {
  if (!url) return "#";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(url)) return `mailto:${url}`;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) return url;
  return `https://${url}`;
}

export default function SocialLink({ social, showText = false, size = "md" }) {
  const icon = getSocialIcon(social.url, social.name, size);
  const formattedUrl = formatUrl(social.url);
  return (
    <a
      href={formattedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
      aria-label={`Visit ${social.name}`}
    >
      {icon}
      {showText && <span className="text-sm">{social.name}</span>}
      {!showText && <span className="sr-only">{social.name}</span>}
    </a>
  );
}
