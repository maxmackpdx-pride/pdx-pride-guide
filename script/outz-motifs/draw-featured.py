"""Location-specific contour artwork drawn from the references in research.json."""
import json
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'client/public/motifs/outz/places'
rows=json.loads((DIR/'research.json').read_text())
def pine(x,y,s=1):
 return f'<g transform="translate({x} {y}) scale({s})"><path d="M0 0V-55M-17-15L0-43 17-15M-13-30L0-55 13-30"/></g>'
def tent(x,y,s=1):
 return f'<g transform="translate({x} {y}) scale({s})"><path d="M0 0L27-40 55 0ZM17 0L27-23 39 0M27-40L68-8 55 0"/></g>'
scenes={
'silver-falls':('South Falls basalt overhang and walk-behind trail', 'https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=151','https://cdn.crowdriff.com/in-use/be51c8ff-ae21-6602-1ec2-6d35b695dba8/750.jpg',
 '<path d="M20 86Q62 64 103 70L116 74M143 74Q188 56 244 85M20 105Q60 89 103 101M147 99Q196 83 244 111M30 143Q53 121 101 124M148 123Q193 115 238 145M29 159Q57 183 116 183M147 183Q202 178 236 158"/><path d="M116 74Q120 123 111 179M143 74Q133 126 149 179M128 81V166M138 90L132 175M106 191Q131 202 157 189M93 203Q132 217 176 203"/>'+pine(49,76,.7)+pine(204,68,.8)),
'cape-lookout':('Narrow forested basalt headland projecting into Pacific surf','https://www.oregonocean.info/index.php/marine-conservation-area/cape-lookout','https://www.oregonocean.info/images/sites/aerial/sclr_shorezone_01652_2011_med.jpg',
 '<path d="M15 78Q58 65 96 108L178 148 241 168 218 192 150 177 88 159 40 127 15 128M40 127L46 146 86 171 147 189 217 202 241 168M86 159V171M151 177L147 189M189 160L182 183M37 169Q63 184 94 186M21 190Q62 207 96 209M113 216Q184 230 238 212M184 131Q203 128 226 137"/>'+pine(44,100,.55)+pine(76,121,.62)+pine(104,135,.45)+pine(132,147,.4)+pine(164,159,.32)),
'beacon-rock':('Basalt monolith with switchback ledges above the Columbia','https://www.oregonhikers.org/field_guide/Beacon_Rock_Hike','https://www.oregonhikers.org/w/images/thumb/2/2b/BeaconRockJenThomas.jpg/600px-BeaconRockJenThomas.jpg',
 '<path d="M42 190L62 152 68 108 88 74 104 49 136 36 164 48 187 84 197 140 218 190M85 172L91 107 112 66M143 53L153 103 150 179M174 97L182 162M56 190H227M28 211Q79 202 130 211T245 209M51 229Q112 221 184 230"/><path d="M68 168L129 157 85 143 141 129 98 114 145 99 117 85"/>'+pine(27,192,.7)+pine(232,190,.6)),
'stub-stewart':('Coast Range rolling forest hills and hilltop rail overlook','https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=75','https://stateparks.oregon.gov/index.cfm?do=image.get&fit=cover&h=600&name=view_from-cabins104313.jpg&park=75&w=1200',
 '<path d="M16 92Q46 61 77 83T139 81T202 82T248  seventy"/>' .replace(' seventy','95')+
 '<path d="M16 117Q60 89 106 114T182 110T248 120M18 145Q62 126 96 141T155 147T245 136M21 192Q90 169 158 189T244 191M28 223V165M97 213V160M176 222V174M236 228V183M24 180L98 175 177 189 240 199M25 192L98 187 177 201 240 211"/>'+pine(53,151,.55)+pine(124,159,.65)+pine(209,154,.6)),
'memaloose':('River overlook campsite, spreading shade trees and dry Gorge hills','https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=118','https://stateparks.oregon.gov/index.cfm?do=image.get&fit=cover&h=600&name=Memaloose011940.jpg&park=118&w=1200',
 '<path d="M14 111Q47 86 83 97T155 89T242 103M21 127H236M66 146Q100 139 137 146T231 143M90 162Q148 155 211 163M20 224Q100 206 241 221M37 192V93M37 115Q7 110 17 88Q5 60 36 58Q59 36 79 62Q105 64 94 91Q101 115 66 117M39 143L67 121M172 129Q185 118 208 127Z"/>'+tent(99,210,.85))
}
for id,(feature,url,image,paths) in scenes.items():
 row=next(r for r in rows if r['id']==id)
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 264 264"><title>{escape(row["name"])}</title><g fill="none" stroke="#39FF14" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">{paths}</g></svg>'
 (DIR/f'{id}.svg').write_text(svg)
 row.update(status='drawn-awaiting-visual-review',visualFeatures=[feature],references=[{'url':url,'image':image}],asset=f'/motifs/outz/places/{id}.svg')
(DIR/'research.json').write_text(json.dumps(rows,indent=2)+'\n')
