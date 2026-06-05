Pod::Spec.new do |s|
  s.name           = 'ExpoPermissionKit'
  s.version        = '0.1.0'
  s.summary        = 'A developer-friendly permissions library for Expo and React Native.'
  s.description    = 'One call handles the full workflow — check, request, wait for app resume, return final status.'
  s.author         = { 'Abrar Mehraj' => '' }
  s.homepage       = 'https://github.com/AbrarMehraj/plugins-playground'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: 'https://github.com/AbrarMehraj/plugins-playground.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
