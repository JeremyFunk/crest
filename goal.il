declare input1, int32
in input

declare operator, char
in operator

declare input2, int32
in input2

declare result, int32

if eq operator, 43 ; +
store result, add input1, input2
elseif eq operator, 42 ; *
store result, mul input1, input2
end


print input1
print operator
print input2
print '\n'
print result

halt