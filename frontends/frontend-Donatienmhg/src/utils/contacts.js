import { FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa6'

/** Liens de contact renseignés (route 1, `contacts`) ; ceux qui manquent sont ignorés. */
export function listeContacts(contacts) {
  return [
    contacts.linkedin && { href: contacts.linkedin, label: 'LinkedIn', Icone: FaLinkedin },
    contacts.github && { href: contacts.github, label: 'GitHub', Icone: FaGithub },
    contacts.email && { href: `mailto:${contacts.email}`, label: 'E-mail', Icone: FaEnvelope },
  ].filter(Boolean)
}
