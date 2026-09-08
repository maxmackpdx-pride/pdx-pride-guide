from drawing import pine,save,rows
# Each approach shares the Alpine Trail corridor but has its own composition.
paths={
'usfs-5054.005621':('<path d="M19 161Q66 147 123 172T245 160M91 247Q83 216 144 201T161 171M129 248Q114 218 175 212T185 174M19 211L43 193 61 203M205 242L221 226 242 238"/>'+pine(34,181,1.15)+pine(222,182,1.25)+pine(99,152,.7), 'Lower ridge junction: forest singletrack and exposed rocky shoulder'),
'usfs-5094.005641':('<path d="M72 245Q142 204 134 169T144 139M115 245Q176 204 158 175T166 141M19 235Q38 218 63 230M202 248L218 240 241 242M14 145L34 135M227 136L249 124"/>'+pine(30,205,1.65)+pine(233,224,1.8)+pine(91,164,.7)+'<path d="M37 226L55 208 63 217M191 204L208 184 215 199"/>','Lower Alpine: steep descending singletrack through tall forest'),
'usfs-5026.005621':('<path d="M25 170Q70 160 116 179T240 181M32 243Q94 199 160 211M74 247Q115 221 169 224M96 153L157 115 213 151 197 157 157 131 111 163ZM111 163V194H197V157M124 159V184M181 154V184M130 189H180"/>'+pine(37,166,.85)+pine(228,204,1.2),'Upper corridor: Elk Camp shelter and grassy forest opening'),
'usfs-5027.005621':('<path d="M19 144Q76 121 132 146T245 137M19 159Q76 142 128 162T245 151M108 246Q98 214 145 193T158 158M145 246Q129 220 168 202T177 162M34 238L47 223M210 236L228 218"/>'+pine(30,128,.65)+pine(214,139,.6)+'<path d="M56 225V198M47 204Q56 181 65 204ZM70 239V210M62 216Q70 193 78 216ZM196 219V191M188 199Q196 176 204 199Z"/>','Upper road access: marshy meadow, beargrass and fir edge'),
'usfs-5067.005621':('<path d="M18 152Q61 113 107 142Q133 163 170 138T246 152M24 172Q74 147 111 169T184 164T245 172M98 248Q89 218 122 204T145 173M135 248Q119 223 147 211T165 176M27 212L37 197 47 211M217 223L232 205 239 223"/>'+pine(55,166,.72)+pine(217,171,.82)+'<path d="M99 111Q119 103 140 111M144 98Q166 91 188 99"/>','Windy Pass: saddle between wooded shoulders and sweeping meadow tread'),
'usfs-5129010262':('<path d="M23 157Q101 137 204 155T225 216Q132 238 45 212T23 157ZM36 177Q108 161 207 179M55 203Q114 189 190 205M211 231Q239 204 233 172M31 136Q86 118 145 134T237 138"/>'+pine(44,151,.9)+pine(95,144,.65)+pine(184,151,.85)+pine(230,158,.65)+'<path d="M43 175L43 192M89 171L90 185M185 180L185 196"/>','Lake Alta: low forest horizon, still-water reflections and east-shore path'),
'usfs-296847010602':('<path d="M18 127Q78 99 130 129T245 113M18 142Q63 127 119 144T244 130M22 165L88 136 114 146 133 165 148 165 189 197 165 241 119 228 91 205 56 199 22 216M88 136L80 165 91 205M114 146L107 177 119 228M133 165L137 196 165 241M29 224L48 215 64 226M179 219L208 192 241 187"/>'+pine(211,173,.85),'Angels Rest: broken basalt summit ledges over a distant Columbia River bend')}
scenes={}
for id,(art,feature) in paths.items():
 row=next(x for x in rows if x['id']==id); ref=row['references'][0]
 scenes[id]=(feature,ref['url'],ref['image'],art)
save(scenes)
