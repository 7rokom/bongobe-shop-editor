import { Link } from "react-router-dom";
import { Facebook, Youtube, Twitter, Linkedin, MapPin, Phone, Mail, Pin, User, PhoneCall, ShieldQuestion, HelpCircle, FileText } from "lucide-react";
import { useSiteSettingsStore } from "@/stores/useSiteSettingsStore";

const iconMap: Record<string, React.ElementType> = {
  User, PhoneCall, ShieldQuestion, HelpCircle, FileText,
};

const Footer = () => {
  const { logoUrl, address, phone, email, facebookUrl, youtubeUrl, twitterUrl, linkedinUrl, pinterestUrl, legalPages } = useSiteSettingsStore();

  return (
    <footer>
      <div className="bg-gradient-to-r from-[hsl(220,20%,10%)] via-[hsl(150,30%,15%)] to-[hsl(130,100%,28%)]">
        <div className="container-box py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Col 1 - About */}
            <div>
              <img src={logoUrl} alt="BongoBe" className="h-10 w-auto object-contain mb-3 brightness-0 invert" />
              <p className="text-[15px] text-white/70 leading-relaxed">
                BongoBee is a Bangladeshi online shopping platform where you can easily find authentic products including and more at affordable prices. We prioritize fast delivery, easy ordering and customer satisfaction.
              </p>
            </div>

            {/* Col 2 & 3 - Legal + Follow side by side */}
            <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-8">
              {/* Legal */}
              <div>
                <h3 className="font-semibold text-[17px] text-white mb-3">Legal Pages</h3>
                <ul className="space-y-1.5 text-[15px] text-white/70">
                  {(legalPages || []).map((page, i) => {
                    const IconComp = iconMap[page.icon] || FileText;
                    const isExternal = page.url.startsWith('http');
                    return (
                      <li key={i}>
                        {isExternal ? (
                          <a href={page.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                            <IconComp className="h-4 w-4 flex-shrink-0" /> {page.label}
                          </a>
                        ) : (
                          <Link to={page.url} className="flex items-center gap-2 hover:text-white transition-colors">
                            <IconComp className="h-4 w-4 flex-shrink-0" /> {page.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Follow Us */}
              <div>
                <h3 className="font-semibold text-[17px] text-white mb-3">Follow Us</h3>
                <ul className="space-y-1.5 text-[15px] text-white/70">
                  {facebookUrl && (
                    <li>
                      <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                        <Facebook className="h-4 w-4" /> Facebook
                      </a>
                    </li>
                  )}
                  {youtubeUrl && (
                    <li>
                      <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                        <Youtube className="h-4 w-4" /> Youtube
                      </a>
                    </li>
                  )}
                  {pinterestUrl && (
                    <li>
                      <a href={pinterestUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                        <Pin className="h-4 w-4" /> Pinterest
                      </a>
                    </li>
                  )}
                  {twitterUrl && (
                    <li>
                      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                        <Twitter className="h-4 w-4" /> Twitter
                      </a>
                    </li>
                  )}
                  {linkedinUrl && (
                    <li>
                      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                        <Linkedin className="h-4 w-4" /> LinkedIn
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Col 4 - Contact */}
            <div>
              <ul className="space-y-2 text-[15px] text-white/70 mt-6 lg:mt-0">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" /> {address}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" /> Call: {phone}
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" /> Email: {email}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-[hsl(220,15%,13%)]">
        <div className="container-box py-4 text-center text-[15px] text-white/60">
          © 2026 BongoBe All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
