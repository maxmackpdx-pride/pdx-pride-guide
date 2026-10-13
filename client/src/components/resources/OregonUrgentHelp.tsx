import { ArrowUpRight, Phone } from 'lucide-react';

// Verified against the linked official providers on 2026-10-13.
const services = [
  {name:'988 Suicide & Crisis Lifeline', note:'Crisis counseling and support by phone, text, or online chat.', number:'988', call:'tel:988?oai_link_source=model_response_hotline', text:'sms:988?oai_link_source=model_response_hotline', url:'https://988lifeline.org/chat/?oai_link_source=model_response_hotline', link:'Chat with a counselor'},
  {name:'Domestic or sexual violence', note:'Call to Safety: free, confidential, 24/7 support, safety planning, and referrals for survivors and supporters.', number:'888-235-5333', call:'tel:18882355333', url:'https://calltosafety.org/services/crisis-line/', link:'Call to Safety services'},
  {name:'Poisoning or toxic exposure', note:'Oregon Poison Center: free, confidential advice from medical professionals, 24/7.', number:'800-222-1222', call:'tel:18002221222', url:'https://www.ohsu.edu/oregon-poison-center', link:'Oregon Poison Center'},
  {name:'Report abuse or neglect', note:'Report suspected abuse or neglect of a child or adult in Oregon. For danger happening right now, call 911.', number:'855-503-7233', call:'tel:18555037233', url:'https://www.oregon.gov/odhs/report-abuse/Pages/default.aspx', link:'Oregon abuse reporting'},
  {name:'Sexual assault support', note:'RAINN: confidential, 24/7 support for survivors and supporters.', number:'800-656-HOPE', call:'tel:18006564673', url:'https://rainn.org/help-and-healing/hotline/', link:'RAINN hotline and online support'},
  {name:'Human trafficking support', note:'Confidential help and reporting options, 24/7.', number:'888-373-7888', call:'tel:18883737888', url:'https://humantraffickinghotline.org/en', link:'Human Trafficking Hotline'},
  {name:'National Domestic Violence Hotline', note:'Help with relationship abuse and safety planning, including online support.', number:'800-799-7233', call:'tel:18007997233', url:'https://www.thehotline.org/', link:'Online support and safety planning'},
];
const directories = [
  {name:'Crisis help in your Oregon county', note:'Oregon Health Authority’s county crisis lines and local mental health programs.', url:'https://www.oregon.gov/oha/ph/preventionwellness/safeliving/suicideprevention/pages/crisislines.aspx'},
  {name:'Find a local survivor program or shelter', note:'Oregon Coalition Against Domestic and Sexual Violence’s statewide provider directory.', url:'https://www.ocadsv.org/find-help/'},
  {name:'Find local crisis and shelter services', note:'211info’s Oregon service directory. Provider hours and availability vary.', url:'https://www.211info.org/get-help/crisis-hotlines/'},
];

export default function OregonUrgentHelp() {
  return <section className="needz-urgent-help" aria-label="Urgent help across Oregon">
    <h4>Urgent help across Oregon</h4>
    <div className="needz-urgent-services">{services.map(service=><article key={service.name}>
      <h5>{service.name}</h5><p>{service.note}</p>
      <div className="needz-urgent-actions"><a href={service.call}><Phone size={16} aria-hidden="true" />{service.number}</a>{service.text && <a href={service.text}>Text 988</a>}</div>
      <a className="rg-safety-source" href={service.url} target="_blank" rel="noopener noreferrer">{service.link}<ArrowUpRight size={14} aria-hidden="true" /></a>
    </article>)}</div>
    <h4>Find the help closest to you</h4>
    <div className="needz-urgent-directories">{directories.map(directory=><a key={directory.name} href={directory.url} target="_blank" rel="noopener noreferrer"><strong>{directory.name}<ArrowUpRight size={16} aria-hidden="true" /></strong><span>{directory.note}</span></a>)}</div>
    <small>Official service pages checked October 13, 2026.</small>
  </section>;
}
