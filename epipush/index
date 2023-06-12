#!/usr/bin/env ruby

`git --version > /dev/null 2>&1`

if $? != 0
    puts 'Git is not installed'
    exit 1
end

@emoji = {
    'add' => '🎉',
    'fix' => '🐛',
    'improve' => '✨',
    'document' => '📚',
    'optimize' => '🚀',
    'configure' => '🔧',
    'merge' => '🔀',
    'remove' => '🗑️',
    'refactor' => '⚡',
    'working' => '🚧',
    'move' => '🚚',
    'update' => '🔄️',
    'security' => '🔒',
    'quality' => '👌',
    'version' => '🔖',
    'warning' => '🚨',
    'release' => '📦',
    'test' => '🔍'
}

if ARGV[0] == 'list'
    puts "🎉 Add: When adding a new feature or file.
    \r🐛 Fix: When fixing a bug.
    \r✨ Improve: When improving an existing feature.
    \r📚 Document: When adding or updating documentation.
    \r🚀 Optimize: When optimizing performance.
    \r🔧 Configure: When configuring or updating configuration.
    \r🔀 Merge: When merging branches or resolving conflicts.
    \r🔥 Remove: When removing code or files.
    \r⚡️ Refactor: When improving code without adding features.
    \r🚧 Work in Progress: When there is ongoing work that is not yet completed.
    \r🚚 Move: When moving files or directories.
    \r🔄 Update: When updating dependencies, packages, or versions.
    \r🔒 Security: When improving security.
    \r👌 Quality Improvement: When improving code quality.
    \r🔖 Version: When creating or updating version tags.
    \r🚨 Warning: When fixing issues or warnings.
    \r🚑 Critical Fix: When fixing a critical issue.
    \r📦 Release: When publishing or preparing for a new release.
    \r🔍 Test: When adding, modifying, or running tests."
    exit
elsif ARGV[0] == '-h'
    puts "USAGE\n\tepipush [type] [message] [files]\n
    \rDESCRIPTION
    \r\tType\tType of commit. Use 'epipush list' to see all types.
    \r\tMessage\tCommit message.
    \r\tFiles\tFiles to commit."
    exit
end

type, message, *files = ARGV

if type.nil?
    warn 'Please enter a commit type'
    exit 1
end

if !@emoji.key?(type.downcase)
    warn 'Please enter a valid commit type'
    exit 1
end

if message.nil?
    warn 'Please enter a commit message'
    exit 1
end

if files.empty?
    warn 'Please enter files'
    exit 1
end

`git add #{files.join(' ')} > /dev/null 2>&1`

if $? == 0
    puts "Added #{files.join(', ')}"
else
    warn 'Something went wrong...'
    exit 1
end

`git commit -m "#{@emoji[type.downcase]} #{type.capitalize}: #{message}" > /dev/null 2>&1`

if $? == 0
    puts "Committed #{@emoji[type.downcase]}"
else
    warn 'Something went wrong...'
    exit 1
end

`git push > /dev/null 2>&1`

if $? == 0
    puts "\e[32mPushed ✔️\e[0m"
else
    warn 'Something went wrong...'
    exit 1
end