import Image from "next/image";
import {
  BsTwitter,
  BsFacebook,
  BsInstagram,
  BsLinkedin,
} from "react-icons/bs";

import styles from "./Footer.module.css";

const footerSections = [
  {
    title: "Project",
    links: ["Houses", "Rooms", "Flats", "Appartments"],
  },
  {
    title: "Company",
    links: ["How we work ?", "Capital", "Security"],
  },
  {
    title: "Movement",
    links: ["Movement", "Support us", "Pricing"],
  },
  {
    title: "Help",
    links: ["Privacy", "Condition", "Blog", "FAQs"],
  },
];

const socialLinks = [
  { name: "Twitter", icon: BsTwitter, href: "#" },
  { name: "Facebook", icon: BsFacebook, href: "#" },
  { name: "Instagram", icon: BsInstagram, href: "#" },
  { name: "LinkedIn", icon: BsLinkedin, href: "#" },
];

export default function Footer() {
  return (
    <section id="footer" className={styles.footer}>
      <div className="container">
        <footer className="row row-cols-1 row-cols-sm-2 row-cols-md-5 py-5">
          {/* Brand and social links */}
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="mb-3">
              <Image
                src="/images/logo/rental-logo03.png"
                alt="Rental logo"
                width={120}
                height={90}
                className={styles.logo}
              />
            </div>

            <p className="text-white">
              Find it. Rent it. Live it. — RentHub helps you discover, book and manage rental homes in one place.
            </p>

            <div className="d-flex gap-3">
              {socialLinks.map(({ name, icon: Icon, href }) => (
                <a
                  key={name}
                  href={href}
                  aria-label={name}
                  className={styles.socialLink}
                >
                  <Icon size={22} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation sections */}
          {footerSections.map((section) => (
            <div className="col-md-2 mb-4 mb-md-0" key={section.title}>
              <h4 className={styles.sectionTitle}>{section.title}</h4>

              <ul className="nav flex-column">
                {section.links.map((link) => (
                  <li className="nav-item mb-2" key={link}>
                    <a href="#" className={styles.footerLink}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </footer>

        {/* Bottom footer */}
        <div
          className={`d-flex flex-wrap justify-content-between align-items-center py-3 mt-3 ${styles.footerBottom}`}
        >
          <div className="col-md-8">
            <span className="text-white">
              © {new Date().getFullYear()} Valencia, Venezuela
            </span>
          </div>

          <div className="col-md-4">
            <p className="text-white mb-0">
              Full Stack Web Developer: {"Sergio Moncada "}
              <a
                href="https://templatesjungle.com/"
                className="text-white text-decoration-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Next.js - V:16.4.5
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}