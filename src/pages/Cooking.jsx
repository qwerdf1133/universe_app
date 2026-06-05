import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { getPostposition } from '../utils/korean';
import { Flame, Check, X, AlertCircle, ArrowLeft, ArrowRight, BookOpen, Utensils, HelpCircle, Search, ShoppingCart, Plus } from 'lucide-react';
import { fetchRecipes } from '../utils/api';
import { parseIngredientsList, detectCategoryByFoodName } from '../utils/categories';
import { getHouseholdData, setHouseholdData } from '../utils/household';

const RECIPES = [
  {
    id: 'r1',
    name: '돼지고기 김치찌개',
    ingredients: '김치 1/4포기, 돼지고기 200g, 두부 1/2모, 대파 1대, 다진 마늘 1T, 고춧가루 2T, 국간장 1T',
    matchIngredients: ['김치', '돼지고기', '삼겹살', '두부', '대파', '파', '마늘', '고춧가루', '국간장', '간장'],
    difficulty: '쉬움',
    emoji: '🍲',
    imageBg: 'linear-gradient(135deg, #fee2e2 0%, #ef4444 100%)',
    detailedSteps: [
      {
        stepText: '김치와 돼지고기, 두부는 한 입에 먹기 좋은 2~3cm 크기로 네모나게 썰고, 대파는 얇게 어긋 썰기로 잘라 준비합니다. 다진 마늘도 1스푼 준비해 둡니다.',
        actionName: '재료 준비 & 썰기',
        actionIcon: '🔪',
        actionBg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
      },
      {
        stepText: '냄비에 식용유 1스푼을 가볍게 두르고 약불로 켭니다. 썰어둔 돼지고기와 다진 마늘 1스푼을 넣은 후, 고기 표면이 하얗게 변할 때까지 약 2분간 저어가며 달달 볶아 향을 냅니다.',
        actionName: '마늘과 고기 볶기',
        actionIcon: '🥩',
        actionBg: 'linear-gradient(135deg, #ffedd5 0%, #f97316 100%)'
      },
      {
        stepText: '고기가 어느 정도 익어가면 썰어둔 배추김치 1/4포기를 넣습니다. 돼지고기 기름과 마늘 양념이 김치에 쏙 벨 수 있도록 중불에서 김치 숨이 부드럽게 죽을 때까지 약 3분간 충분히 함께 볶아줍니다.',
        actionName: '김치 투하 & 볶기',
        actionIcon: '🥬',
        actionBg: 'linear-gradient(135deg, #dcfce7 0%, #22c55e 100%)'
      },
      {
        stepText: '김치가 나른해지면 물 또는 쌀뜨물 3컵(약 600ml)을 재료가 잠길 만큼 부어줍니다. 가스불을 센 불로 켜서 한 번 끓어오르면, 바로 중약불로 줄여 뚜껑을 닫고 10분 이상 뭉근하게 푹 끓여 진한 국물 맛을 냅니다.',
        actionName: '육수 붓고 끓이기',
        actionIcon: '♨️',
        actionBg: 'linear-gradient(135deg, #ecfeff 0%, #06b6d4 100%)'
      },
      {
        stepText: '국물이 맛있게 졸아들면 썰어둔 두부 1/2모와 매콤한 고춧가루 2스푼, 깊은 맛을 낼 국간장 1스푼을 골고루 뿌려 넣어 찌개의 간을 맞추고 보글보글 끓여줍니다.',
        actionName: '양념 및 두부 넣기',
        actionIcon: '🧂',
        actionBg: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)'
      },
      {
        stepText: '마지막으로 얇게 썰어둔 대파를 찌개 위에 듬뿍 얹어줍니다. 약 2분간만 대파 향이 우러나오도록 한소끔 더 끓여내면 매콤칼칼하고 개운한 한국인의 소울푸드 돼지고기 김치찌개가 완벽하게 완성됩니다!',
        actionName: '대파 얹어 마무리',
        actionIcon: '🍲',
        actionBg: 'linear-gradient(135deg, #fee2e2 0%, #ef4444 100%)'
      }
    ]
  },
  {
    id: 'r2',
    name: '차돌 된장찌개',
    ingredients: '된장 2T, 두부 1/2모, 감자 1개, 양파 1/2개, 대파 1/2대, 다진 마늘 1T, 차돌박이 100g',
    matchIngredients: ['된장', '두부', '감자', '양파', '대파', '파', '마늘', '차돌박이', '고기', '돼지고기'],
    difficulty: '보통',
    emoji: '🥘',
    imageBg: 'linear-gradient(135deg, #ffedd5 0%, #d97706 100%)',
    detailedSteps: [
      {
        stepText: '감자와 양파는 숟가락으로 떠먹기 좋게 사방 1.5cm 크기로 깍둑썰기합니다. 두부도 비슷한 두께로 도톰하게 썰고, 대파는 송송 얇게 썰어 대기합니다.',
        actionName: '야채와 두부 썰기',
        actionIcon: '🔪',
        actionBg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
      },
      {
        stepText: '불을 약불로 켜고, 기름을 두르지 않은 뚝배기나 냄비에 차돌박이 100g을 그대로 넣습니다. 젓가락으로 뭉치지 않게 풀어가며 차돌박이의 고소한 기름이 자작하게 우러나올 때까지 1~2분간 가볍게 볶습니다.',
        actionName: '차돌박이 볶아 기름내기',
        actionIcon: '🥩',
        actionBg: 'linear-gradient(135deg, #fee2e2 0%, #ef4444 100%)'
      },
      {
        stepText: '고기 기름이 나오면 물 2.5컵(약 500ml)을 붓고 가스불을 올립니다. 된장 2스푼을 체에 밭쳐 숟가락으로 뭉침 없이 곱고 시원하게 풀어준 뒤, 단단한 감자와 달콤한 양파를 먼저 넣고 센 불에서 5분간 보글보글 끓입니다.',
        actionName: '된장 풀고 단단한 야채 끓이기',
        actionIcon: '🍲',
        actionBg: 'linear-gradient(135deg, #ffedd5 0%, #f97316 100%)'
      },
      {
        stepText: '감자가 포슬포슬하게 절반 이상 익어 찌개 국물이 한층 구수하게 우러나면, 불을 중불로 낮춘 뒤 도톰하게 썰어둔 두부 1/2모와 다진 마늘 1스푼을 찌개 중앙에 쏙 넣어 함께 끓여 줍니다.',
        actionName: '두부와 마늘로 감칠맛 넣기',
        actionIcon: '🥣',
        actionBg: 'linear-gradient(135deg, #ecfeff 0%, #06b6d4 100%)'
      },
      {
        stepText: '두부 속까지 된장 국물이 맛있게 배어들면, 쫑쫑 썰어두었던 대파를 아낌없이 솔솔 뿌려 얹습니다. 약불로 줄여 대파의 향긋한 향이 골고루 녹아들도록 딱 2분만 더 졸이듯 끓여 구수한 밥도둑 차돌 된장찌개를 완성합니다.',
        actionName: '대파 넣고 한소끔 끓이기',
        actionIcon: '🥘',
        actionBg: 'linear-gradient(135deg, #ffedd5 0%, #d97706 100%)'
      }
    ]
  },
  {
    id: 'r3',
    name: '매콤 제육볶음',
    ingredients: '돼지고기 300g, 양파 1/2개, 대파 1대, 고추장 2T, 고춧가루 1T, 진간장 1T, 설탕 1T, 다진 마늘 1T, 참기름 1T',
    matchIngredients: ['돼지고기', '삼겹살', '고기', '양파', '대파', '파', '고추장', '고춧가루', '간장', '설탕', '마늘', '참기름'],
    difficulty: '보통',
    emoji: '🌶️',
    imageBg: 'linear-gradient(135deg, #fee2e2 0%, #dc2626 100%)',
    detailedSteps: [
      {
        stepText: '돼지고기 300g을 먹기 편한 한 입 크기로 얇게 썰어 준비하고, 양파 1/2개는 0.5cm 두께로 채 썹니다. 대파 1대는 조리 시 풍미가 뿜어져 나오도록 4cm 길이로 큼직하게 썰어 준비합니다.',
        actionName: '고기와 아채 썰기',
        actionIcon: '🔪',
        actionBg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
      },
      {
        stepText: '둥근 볼을 준비해 고추장 2스푼, 매운 고춧가루 1스푼, 진간장 1스푼, 달콤한 설탕 1스푼, 다진 마늘 1스푼을 분량대로 넣고 섞어 매콤달콤한 비법 양념장을 만듭니다. 여기에 썰어둔 고기를 넣고 손으로 조물조물 버무려 10분간 간이 쏙 배게 재워 둡니다.',
        actionName: '제육 비법양념에 고기 재우기',
        actionIcon: '🥣',
        actionBg: 'linear-gradient(135deg, #ecfeff 0%, #06b6d4 100%)'
      },
      {
        stepText: '프라이팬을 가스불 중불로 잘 달군 뒤, 식용유를 아주 가볍게 1/2스푼만 두릅니다. 양념에 10분간 재워두었던 돼지고기를 뭉치지 않게 프라이팬 넓게 고루 편 뒤, 젓가락으로 저어가며 겉면의 붉은 핏기가 사라질 때까지 약 3분간 노릇하게 볶아줍니다.',
        actionName: '달군 팬에 양념고기 볶기',
        actionIcon: '🍳',
        actionBg: 'linear-gradient(135deg, #ffedd5 0%, #f97316 100%)'
      },
      {
        stepText: '고기가 거의 다 익어 맛있는 냄새가 솔솔 나기 시작하면 채 썰어둔 아삭한 양파와 큼직한 대파를 한 번에 넣어줍니다. 가스불을 가장 강한 센 불로 높인 후, 야채의 아삭한 식감과 촉촉한 수분이 유지되도록 2분간 숟가락 두 개로 휘리릭 빠르게 볶습니다.',
        actionName: '센 불로 야채 아삭하게 볶기',
        actionIcon: '🔥',
        actionBg: 'linear-gradient(135deg, #fef2f2 0%, #ef4444 100%)'
      },
      {
        stepText: '대파와 양파가 알맞게 숨이 죽고 고기에 빨간 양념이 윤기 나게 코팅되면 가스불을 끕니다. 고소한 참기름 1스푼을 빙 둘러 섞어주고 통깨를 아낌없이 솔솔 뿌려 담아내면 매콤 쫄깃한 프리미엄 제육볶음이 완성됩니다!',
        actionName: '참기름과 통깨로 완성',
        actionIcon: '🌶️',
        actionBg: 'linear-gradient(135deg, #fee2e2 0%, #dc2626 100%)'
      }
    ]
  },
  {
    id: 'r4',
    name: '파송송 계란말이',
    ingredients: '계란 4알, 대파 1/2대, 소금 1/2t, 식용유 2T, 참기름 1t',
    matchIngredients: ['계란', '달걀', '대파', '파', '소금', '식용유', '참기름'],
    difficulty: '쉬움',
    emoji: '🍳',
    imageBg: 'linear-gradient(135deg, #fef3c7 0%, #d97706 100%)',
    detailedSteps: [
      {
        stepText: '초보자도 찢어지지 않는 이쁜 계란말이를 만들기 위한 꿀팁은 파를 최대한 얇게 다지는 것입니다. 대파 1/2대를 십자 방향으로 깊게 칼집을 낸 후, 쫑쫑쫑 아주 미세하게 썰어 다짐 형태로 듬뿍 준비해 줍니다.',
        actionName: '대파 미세하게 다지기',
        actionIcon: '🔪',
        actionBg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
      },
      {
        stepText: '둥근 사발에 계란 4알을 조심스럽게 깨뜨려 넣습니다. 여기에 짭조름한 꽃소금 1/2티스푼과 비린내를 잡고 고소함을 채워줄 참기름 1티스푼을 똑 떨어뜨려 줍니다. 알끈이 뭉치지 않게 포크나 거품기로 1분 이상 완전히 저어 부드러운 계란물을 만들어 둔 뒤 다진 파를 섞습니다.',
        actionName: '소금간 입혀 계란물 만들기',
        actionIcon: '🥣',
        actionBg: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)'
      },
      {
        stepText: '가스불을 최고 약한 약불로 켭니다. 프라이팬에 식용유 1스푼을 두르고 키친타올로 가볍게 훔치듯 닦아내어 팬 전체에 기름 코팅막을 씌워 줍니다. 팬이 따끈해지면 파송송 계란물의 딱 3분의 1 분량만 붓고 팬을 기울여 사방에 얇고 고르게 쫙 펴줍니다.',
        actionName: '팬 기름 코팅 후 계란물 붓기',
        actionIcon: '🍳',
        actionBg: 'linear-gradient(135deg, #ffedd5 0%, #f97316 100%)'
      },
      {
        stepText: '계란 윗부분의 노란 물이 찰랑거리지 않고 부드럽게 반죽처럼 익어갈 때 즈음, 프라이팬 한 쪽 끝에서부터 뒤집개나 숟가락 두 개를 이용해 2.5cm 너비로 조심스럽게 굴려 말아줍니다. 끝까지 다 말았으면 계란말이를 조심히 시작점(팬 앞쪽)으로 슬슬 밀어다 놓습니다.',
        actionName: '부드럽게 굴려 말기',
        actionIcon: '🔄',
        actionBg: 'linear-gradient(135deg, #dcfce7 0%, #22c55e 100%)'
      },
      {
        stepText: '말아둔 계란 뒤편 빈 공간에 다시 가볍게 기름칠을 한 후, 남은 계란물의 절반을 부어 얇게 폅니다. 이때 말아둔 계란말이 밑으로 계란물이 살짝 흘러 들어가 접착제 역할을 하도록 숟가락으로 살짝 들어줍니다. 같은 방식으로 끝까지 말기를 반복하여 도톰하고 단단하게 각을 잡아 완성한 뒤 한 김 식혀 큼직하게 썰어 줍니다.',
        actionName: '이어 붙여 두툼하게 굽기',
        actionIcon: '🍳',
        actionBg: 'linear-gradient(135deg, #fef3c7 0%, #d97706 100%)'
      }
    ]
  },
  {
    id: 'r5',
    name: '국물 떡볶이',
    ingredients: '떡볶이 떡 200g, 어묵 2장, 대파 1대, 고추장 2T, 설탕 1.5T, 진간장 1T, 물 2컵',
    matchIngredients: ['떡', '어묵', '대파', '파', '고추장', '설탕', '간장'],
    difficulty: '쉬움',
    emoji: '🍢',
    imageBg: 'linear-gradient(135deg, #ffe4e6 0%, #e11d48 100%)',
    detailedSteps: [
      {
        stepText: '준비한 쌀떡 또는 밀떡 200g을 찬물이 가득 담긴 그릇에 약 10분간 담가 굳은 떡을 부드럽게 불려 줍니다. 쫄깃한 사각 어묵 2장은 한 입 크기로 먹기 좋게 삼각형이나 네모 모양으로 썰고 대파 1대는 길쭉길쭉하게 어긋 썰기로 큼직하게 준비합니다.',
        actionName: '떡 불리기 & 어묵 야채 썰기',
        actionIcon: '🔪',
        actionBg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
      },
      {
        stepText: '냄비나 깊은 팬에 깨끗한 물 2컵(약 400ml)을 붓고 가스불을 센 불로 켭니다. 여기에 새빨간 고추장 2스푼, 달콤한 백설탕 1.5스푼, 진간장 1스푼을 아낌없이 넣고 국자에 양념이 뭉치지 않도록 국물 소스를 흔들어 완전히 풀어 끓이기 시작합니다.',
        actionName: '양념 소스 국물 끓이기',
        actionIcon: '🍲',
        actionBg: 'linear-gradient(135deg, #ffe4e6 0%, #f43f5e 100%)'
      },
      {
        stepText: '국물 소스가 바글바글 끓어오르면 찬물에 불려두었던 떡볶이 떡의 물기를 쏙 빼서 넣고, 썰어둔 어묵 2장도 함께 넣어줍니다. 떡이 냄비 바닥에 눌어붙어 타지 않도록 국자나 주걱으로 부드럽게 원을 그리듯 저어가며 국물이 떡에 서서히 배어들게 중불에서 4분간 조립니다.',
        actionName: '떡과 어묵 넣고 조리기',
        actionIcon: '🍢',
        actionBg: 'linear-gradient(135deg, #ffedd5 0%, #f97316 100%)'
      },
      {
        stepText: '어묵이 통통하게 부풀어 오르고 떡이 양념을 머금어 말랑말랑 통통해지면, 큼직하게 썰어두었던 대파 1대를 냄비 가득 아낌없이 투하해 줍니다. 떡볶이 국물에 달큰하고 개운한 대파 향이 진하게 스며들도록 불을 살짝 줄여 2분간 더 끓여 줍니다.',
        actionName: '대파 풍성히 넣어 졸이기',
        actionIcon: '🥬',
        actionBg: 'linear-gradient(135deg, #dcfce7 0%, #22c55e 100%)'
      },
      {
        stepText: '떡볶이 국물이 기분 좋게 걸쭉해지고 떡 표면에 빨간 양념이 윤기 있고 매끄럽게 코팅되면 가스불을 끄고 예쁜 그릇에 담아 줍니다. 숟가락으로 달콤매콤한 떡볶이 국물과 쫄깃한 떡, 어묵을 듬뿍 함께 떠서 따뜻할 때 맛있게 드세요!',
        actionName: '걸쭉하게 조려 완성',
        actionIcon: '🍢',
        actionBg: 'linear-gradient(135deg, #ffe4e6 0%, #e11d48 100%)'
      }
    ]
  },
  {
    id: 'r6',
    name: '백종원 간장계란밥',
    ingredients: '햇반 1개, 신선한 계란 1알, 진간장 1T, 고소한 참기름 1T, 식용유 1T',
    matchIngredients: ['햇반', '밥', '계란', '달걀', '간장', '참기름', '식용유'],
    difficulty: '쉬움',
    emoji: '🍚',
    imageBg: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
    detailedSteps: [
      {
        stepText: '햇반 1개를 껍질을 살짝 뜯어 전자레인지에 정확히 2분간 팽팽 돌려 줍니다. 갓 지은 밥처럼 모락모락 김이 나는 따뜻한 밥을 깊이가 있고 비벼 먹기 편한 둥글고 넓은 그릇에 예쁘고 푸짐하게 담아 줍니다.',
        actionName: '따끈하게 밥 데워 담기',
        actionIcon: '🍚',
        actionBg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
      },
      {
        stepText: '프라이팬을 가스불 중불로 켜고 식용유 1스푼을 둘러 줍니다. 팬이 따끈해지면 신선한 계란 1알을 톡 깨서 넣습니다. 뒤집지 않고 약불로 조절한 뒤 흰자 가장자리가 노릇노릇하고 바삭바삭하게 튀겨지듯 구워지도록 반숙 프라이(서니사이드업)를 구워 냅니다.',
        actionName: '바삭 고소한 반숙 후라이 굽기',
        actionIcon: '🍳',
        actionBg: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)'
      },
      {
        stepText: '백종원 간장계란밥의 핵심 꿀팁! 구워지는 계란 프라이 바로 옆 프라이팬 빈 공간에 진간장 1스푼을 붓고 팬의 뜨거운 열기로 지글지글 끓여 줍니다. 간장이 살짝 졸아들며 불 향과 캐러멜라이징된 단 향이 나며 맛있는 풍미가 극대화됩니다.',
        actionName: '프라이팬에 간장 지글지글 끓이기',
        actionIcon: '🧂',
        actionBg: 'linear-gradient(135deg, #ffedd5 0%, #f97316 100%)'
      },
      {
        stepText: '그릇에 미리 담아두었던 따뜻한 밥 위에 바삭하게 부쳐진 고소한 계란 프라이를 조심히 얹고 프라이팬에서 지글지글 끓인 맛있는 불간장을 숟가락으로 싹싹 긁어 밥과 계란 위에 골고루 끼얹어 줍니다.',
        actionName: '밥 위에 후라이와 불간장 얹기',
        actionIcon: '🍽️',
        actionBg: 'linear-gradient(135deg, #ecfeff 0%, #06b6d4 100%)'
      },
      {
        stepText: '마지막으로 아주 고소하고 향긋한 참기름 1스푼을 계란 노른자 위에 촉촉하게 끼얹어 줍니다. 숟가락으로 익지 않은 노란 노른자를 톡 터뜨려 간장 양념과 밥알 사이에 스며들도록 부드럽게 쓱쓱 비벼서 행복한 한 입을 크게 맛봅니다!',
        actionName: '참기름 뿌려 맛있게 비비기',
        actionIcon: '🍚',
        actionBg: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)'
      }
    ]
  }
];

const Cooking = () => {
  const location = useLocation();
  const [ingredients, setIngredients] = useState([]);
  const [recipesList, setRecipesList] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const CATEGORIES = ['전체', '밥', '국', '찌개', '면', '볶음', '튀김', '고기', '생선', '채소', '디저트', '음료', '분식'];
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [visibleCount, setVisibleCount] = useState(5);

  
  // Search & Pagination states
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  // Confirmation Modal states
  const [pendingRecipe, setPendingRecipe] = useState(null);

  // Cooking states
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // Step 0: 전체 재료 확인, Step 1..N: 레시피 과정

  // Final Checklist state
  const [showChecklist, setShowChecklist] = useState(false);
  const [usageChecklist, setUsageChecklist] = useState({}); // { ingredientId: true/false }
  const [cookingResult, setCookingResult] = useState(null); // { name: '', leftovers: [], used: [] }
  const [selectedForPurchase, setSelectedForPurchase] = useState({}); // { ingredientFullName: true/false }

  const loadData = async (cat = '전체', search = '') => {
    setIsFetching(true);
    const list = getHouseholdData('ingredients', []);
    setIngredients(list);

    const today = new Date();
    today.setHours(0,0,0,0);
    
    const ownedNames = list.map(item => item.name.toLowerCase());
    const expiringNames = list.filter(item => {
      if (!item.expDate) return false; // 유통기한 미지정 항목 제외
      const exp = new Date(item.expDate);
      if (isNaN(exp.getTime())) return false;
      exp.setHours(0,0,0,0);
      const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).map(item => item.name.toLowerCase());

    const apiCategory = cat === '전체' ? '' : cat;
    let fetched = await fetchRecipes(1, 30, search, apiCategory);
    
    // Fallback to dummy if no results and no search/category, or just to show something
    if (!fetched || fetched.length === 0) {
      let rawDummy = [];
      if (!search && !apiCategory) {
        rawDummy = RECIPES;
      } else {
        rawDummy = RECIPES.filter(r => 
          (!search || r.name.toLowerCase().includes(search.toLowerCase()) || r.ingredients.toLowerCase().includes(search.toLowerCase())) &&
          (!apiCategory || r.category === apiCategory)
        );
      }
      fetched = rawDummy.map(r => {
        const parsed = parseIngredientsList(r.ingredients);
        return {
          ...r,
          parsedIngredients: parsed,
          matchIngredients: parsed.map(p => p.cleanName)
        };
      });
    }
    setAllRecipes(fetched);

    const matched = fetched.map(recipe => {
      const matchIngredientsSafe = recipe.matchIngredients || [];
      const matchedOwnedItems = list.filter(item => 
        matchIngredientsSafe.some(m => 
          item.name.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(item.name.toLowerCase())
        )
      );

      let matchCount = 0;
      let expiringBonus = 0;
      
      matchIngredientsSafe.forEach(m => {
        if (ownedNames.some(name => name.includes(m.toLowerCase()) || m.toLowerCase().includes(name))) {
          matchCount++;
          if (expiringNames.some(name => name.includes(m.toLowerCase()) || m.toLowerCase().includes(name))) {
            expiringBonus += 10; 
          }
        }
      });

      return {
        ...recipe,
        matchCount,
        sortScore: matchCount + expiringBonus,
        matchedOwnedItems
      };
    });

    matched.sort((a, b) => b.sortScore - a.sortScore);
    setRecipesList(matched);
    setIsFetching(false);
  };

  useEffect(() => {
    loadData(selectedCategory, searchTerm);
  }, [selectedCategory]);

  const displayedRecipes = recipesList;

  // Handle auto-opening of recipe from Home screen redirection
  useEffect(() => {
    if (location.state && location.state.recipe) {
      setPendingRecipe(location.state.recipe);
      // Clear state to prevent reopening on reload
      window.history.replaceState({}, document.title);
    } else if (location.state && location.state.openRecipeId && recipesList.length > 0) {
      const found = recipesList.find(r => r.id === location.state.openRecipeId);
      if (found) {
        // Trigger confirmation modal first
        setPendingRecipe(found);
      }
      // Clear state to prevent reopening on reload
      window.history.replaceState({}, document.title);
    }
  }, [location, recipesList]);

  // Click card action -> trigger confirmation popup
  const handleCardClick = (recipe) => {
    setPendingRecipe(recipe);
  };

  // Start Cooking (clicks "만들래요!")
  const handleStartCooking = () => {
    if (!pendingRecipe) return;
    
    // Recalculate matchedOwnedItems with latest refrigerator state
    const latestIngredients = getHouseholdData('ingredients', []);
    const matchIngredientsSafe = pendingRecipe.matchIngredients || [];
    const matchedOwnedItems = latestIngredients.filter(item => 
      matchIngredientsSafe.some(m => 
        item.name.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(item.name.toLowerCase())
      )
    );

    const recipe = {
      ...pendingRecipe,
      matchedOwnedItems
    };
    
    setSelectedRecipe(recipe);
    setPendingRecipe(null);
    setActiveStep(0); // Step 0: 전체 재료 확인

    // Initialize usage checklist (default: checked "모두 사용함" for owned items, except sauces/seasonings which default to false / kept)
    const initialCheck = {};
    matchedOwnedItems.forEach(item => {
      const cat = (item.category || '').trim();
      const isSauce = cat === '소스류' || 
                      cat === '조미료' || 
                      cat === '발효식품' || 
                      cat === '소스/양념' || 
                      cat === '향신료' || 
                      cat.includes('소스') || 
                      cat.includes('양념') || 
                      cat.includes('조미료');
      initialCheck[item.id] = !isSauce; // true means "fully used" (delete), false means "leftover" (remain/keep)
    });
    setUsageChecklist(initialCheck);
    
    setIsDetailOpen(true);
    setShowChecklist(false);
    setCookingResult(null);
    setSelectedForPurchase({});
  };

  const handleToggleCheck = (itemId) => {
    setUsageChecklist(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Final submit (clicks "완료" on used vs leftovers Checklist)
  const handleCompleteCooking = () => {
    if (!selectedRecipe) return;

    const list = getHouseholdData('ingredients', []);

    const leftovers = [];
    const used = [];

    // Separate ingredients based on usage checklist
    selectedRecipe.matchedOwnedItems.forEach(item => {
      const isFullyUsed = usageChecklist[item.id];
      if (isFullyUsed) {
        used.push(item.name);
      } else {
        leftovers.push(item.name);
      }
    });

    // Update ingredients in localStorage: filter out fully used items
    const updatedIngredients = list.filter(item => {
      const matchedItem = selectedRecipe.matchedOwnedItems.find(m => m.id === item.id);
      if (matchedItem && usageChecklist[item.id]) {
        return false; // delete
      }
      return true; // keep
    });

    setHouseholdData('ingredients', updatedIngredients);
    
    // Hide checklist and show result screen
    setShowChecklist(false);
    
    // Set result screen data
    setCookingResult({
      name: selectedRecipe.name,
      leftovers,
      used
    });

    // Reload ingredients state in the screen
    loadData();
  };

  const handleCloseAll = () => {
    setIsDetailOpen(false);
    setSelectedRecipe(null);
    setCookingResult(null);
    setShowChecklist(false);
    setActiveStep(0);
  };

  const handleTogglePurchaseSelect = (fullName) => {
    setSelectedForPurchase(prev => ({
      ...prev,
      [fullName]: !prev[fullName]
    }));
  };

  const handleBatchAddToShopping = (missingItems) => {
    const selectedList = missingItems.filter(p => selectedForPurchase[p.fullName]);
    if (selectedList.length === 0) {
      alert('장바구니에 담을 식재료를 먼저 선택해 주세요.');
      return;
    }

    const stored = localStorage.getItem('shopping-list');
    const list = stored ? JSON.parse(stored) : [];
    
    let addedCount = 0;
    let skippedCount = 0;

    selectedList.forEach(p => {
      if (list.some(item => item.name.toLowerCase() === p.cleanName.toLowerCase())) {
        skippedCount++;
        return;
      }
      list.push({
        id: Date.now() + Math.random(),
        name: p.cleanName,
        category: detectCategoryByFoodName(p.cleanName).name,
        memo: `${selectedRecipe.name} 요리를 위해 추가됨 (${p.quantity || '적당량'})`,
        checked: false
      });
      addedCount++;
    });

    localStorage.setItem('shopping-list', JSON.stringify(list));
    
    let msg = `선택한 ${selectedList.length}개 중 ${addedCount}개의 재료를 장보기 목록에 추가했습니다!`;
    if (skippedCount > 0) {
      msg += ` (${skippedCount}개는 이미 존재하여 제외됨)`;
    }
    alert(msg);
    
    setSelectedForPurchase({});
  };

  return (
    <div className="page-container">
      <Header title="추천 요리 레시피" />
      <div className="content" style={{ paddingBottom: '80px', paddingTop: '10px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={20} color="var(--primary-color)" />
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-black)' }}>
              {searchTerm ? `'${searchTerm}' 검색 결과` : '내 맞춤 추천 요리'}
            </h2>
          </div>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            onClick={() => setIsSearchModalOpen(true)}
          >
            <Search size={16} /> 요리 검색
          </button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '0px', marginBottom: '20px' }}>
          {searchTerm ? '검색어와 관련된 레시피를 확인하세요.' : '내 냉장고 속 식재료와 매칭률이 높은 순서대로 레시피를 추천합니다. (유통기한 임박 재료 우선)'}
        </p>
        {/* Categories */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '12px', marginBottom: '8px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setVisibleCount(5);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                background: selectedCategory === cat ? 'var(--primary-color)' : '#f3f4f6',
                color: selectedCategory === cat ? '#fff' : 'var(--gray-600)',
                fontSize: '13px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>


        {isFetching ? (
          <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>레시피를 불러오는 중입니다...</div>
        ) : displayedRecipes.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '40px 20px', fontSize: '14px', background: '#f9fafb', borderRadius: '12px' }}>
            요리를 찾을 수 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {displayedRecipes.slice(0, visibleCount).map((recipe) => {
            const hasMatched = recipe.matchCount > 0;
            
            // Set difficulty badge color
            let diffColor = '#48bb78'; // green for 쉬움
            if (recipe.difficulty === '보통') diffColor = '#f59e0b'; // orange
            if (recipe.difficulty === '어려움') diffColor = '#ef4444'; // red

            return (
              <div 
                key={recipe.id}
                onClick={() => handleCardClick(recipe)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.01)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.01)';
                }}
              >
                {/* Left Side: Gradient Completed dish image block */}
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '12px',
                  background: recipe.imageBg || 'linear-gradient(135deg, #e0f2ec 0%, #379271 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  flexShrink: 0,
                  boxShadow: '0 3px 6px rgba(0,0,0,0.05)',
                  overflow: 'hidden'
                }}>
                  {recipe.mainImage ? (
                    <img src={recipe.mainImage} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    recipe.emoji
                  )}
                </div>

                {/* Right Side: Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-black)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {recipe.name}
                    </h3>
                    
                    {/* Difficulty Badge */}
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: diffColor,
                      border: `1.2px solid ${diffColor}`,
                      padding: '1px 5px',
                      borderRadius: '5px'
                    }}>
                      {recipe.difficulty}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '11px', color: 'var(--gray-500)', margin: '0 0 6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    재료: {recipe.ingredients}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Owned ingredient highlights */}
                    <span style={{ fontSize: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                      {hasMatched ? `보유 재료 ${recipe.matchCount}개 매칭` : '매칭 재료 없음'}
                    </span>

                    {/* Compact Badge */}
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      background: hasMatched ? '#e0f2ec' : '#f3f4f6',
                      color: hasMatched ? 'var(--primary-color)' : 'var(--gray-500)',
                      padding: '2px 6px',
                      borderRadius: '6px'
                    }}>
                      {hasMatched ? '조리가능' : '재료부족'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {displayedRecipes.length > visibleCount && (
            <button 
              className="btn-primary" 
              style={{ background: '#f3f4f6', color: 'var(--gray-600)', border: 'none', marginTop: '8px' }}
              onClick={() => setVisibleCount(prev => Math.min(prev + 5, 30))}
            >
              더보기 ({visibleCount}/{Math.min(displayedRecipes.length, 30)})
            </button>
          )}
        </div>
      )}
      </div>

      {/* ==================== 0. SEARCH MODAL ==================== */}
      {isSearchModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#fff', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--gray-200)' }}>
            <button onClick={() => setIsSearchModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '16px' }}>
              <ArrowLeft size={24} color="var(--text-black)" />
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                placeholder="어떤 요리를 찾으시나요?" 
                className="input-field" 
                autoFocus
                style={{ width: '100%', paddingRight: '40px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchTerm(e.target.value);
                    setIsSearchModalOpen(false);
                    setVisibleCount(5);
                    loadData(selectedCategory, e.target.value);
                  }
                }}
                id="search-input"
              />
              <button 
                onClick={() => {
                  const val = document.getElementById('search-input').value;
                  setSearchTerm(val);
                  setIsSearchModalOpen(false);
                  setVisibleCount(5);
                  loadData(selectedCategory, val);
                }}
                style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Search size={20} color="var(--primary-color)" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 1. CONFIRMATION POPUP ("~ 만들까요?") ==================== */}
      {pendingRecipe && (
        <>
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setPendingRecipe(null)}
          >
            <div style={{
              backgroundColor: '#FFFFFF',
              width: '85%',
              maxWidth: '340px',
              borderRadius: '20px',
              padding: '24px 20px',
              boxSizing: 'border-box',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              animation: 'scaleUp 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>{pendingRecipe.emoji}</div>
              
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-black)', marginBottom: '8px', lineHeight: '1.4' }}>
                {getPostposition(pendingRecipe.name, '을', '를')} 만들까요?
              </h3>
              
              <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '20px', lineHeight: '1.4' }}>
                초보자도 알기 쉬운 단계별 그림 가이드가<br />
                제공되며 조리 완료 시 재료가 자동 차감됩니다!
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setPendingRecipe(null)}
                  style={{
                    flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px',
                    fontSize: '13px', fontWeight: 'bold', color: 'var(--gray-500)', cursor: 'pointer'
                  }}
                >
                  아니에요
                </button>
                <button 
                  onClick={handleStartCooking}
                  style={{
                    flex: 1, padding: '12px', background: 'var(--primary-color)', border: 'none', borderRadius: '10px',
                    fontSize: '13px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(55,146,113,0.2)'
                  }}
                >
                  만들래요!
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== 2. DETAILED COOKING GUIDE MODAL (Step 0 ~ N) ==================== */}
      {isDetailOpen && selectedRecipe && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'stretch',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            width: '100%',
            height: '100%',
            maxHeight: '100%',
            borderRadius: '0',
            padding: '24px 20px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            animation: 'slideUp 0.3s ease-out'
          }}>
            
            {/* Modal Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-200)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>{selectedRecipe.emoji}</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-black)', margin: 0 }}>
                    {selectedRecipe.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {selectedRecipe.category && <span style={{ fontSize: '10px', background: '#e0f2ec', color: 'var(--primary-color)', padding: '2px 6px', borderRadius: '4px' }}>{selectedRecipe.category}</span>}
                    {selectedRecipe.weight && <span style={{ fontSize: '10px', background: '#f3f4f6', color: 'var(--gray-600)', padding: '2px 6px', borderRadius: '4px' }}>{selectedRecipe.weight}</span>}
                    {selectedRecipe.hashTag && <span style={{ fontSize: '10px', color: '#3b82f6' }}>{selectedRecipe.hashTag.split(',').map(tag => `#${tag.trim()} `)}</span>}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleCloseAll} 
                style={{ background: 'none', border: 'none', color: 'var(--gray-400)', padding: '4px', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {cookingResult ? (
              /* ===== D. COOKING RESULT SCREEN ===== */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', animation: 'bounce 1s infinite' }}>✅</div>
                
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-color)', margin: 0, lineHeight: '1.4' }}>
                  냉장고 정리 완료!
                </h3>
                
                <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '-8px' }}>
                  {cookingResult.name} 요리에 사용한 식재료가 냉장고에서 정리되었습니다.
                </p>

                {cookingResult.used.length > 0 && (
                  <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', padding: '14px 16px', borderRadius: '14px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#e53e3e', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🗑️ 삭제된 식재료 ({cookingResult.used.length}개)
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {cookingResult.used.map((name, idx) => (
                        <span key={idx} style={{ fontSize: '11px', background: '#ffffff', color: '#c53030', border: '1px solid #feb2b2', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                          ❌ {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {cookingResult.leftovers.length > 0 && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 16px', borderRadius: '14px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ✅ 남은 식재료 ({cookingResult.leftovers.length}개)
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {cookingResult.leftovers.map((name, idx) => (
                        <span key={idx} style={{ fontSize: '11px', background: '#ffffff', color: '#166534', border: '1px solid #86efac', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                          🧊 {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleCloseAll}
                  className="btn-primary"
                  style={{
                    width: '100%', padding: '14px', margin: 0, marginTop: '10px',
                    fontSize: '14px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Utensils size={16} /> 완료
                </button>
              </div>
            ) : showChecklist ? (
              /* ===== C. USAGE CHECKLIST SCREEN ===== */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', animation: 'bounce 1s infinite' }}>🎉</div>
                
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-color)', margin: 0, lineHeight: '1.4' }}>
                  {getPostposition(selectedRecipe.name, '을', '를')}<br />성공적으로 만들었어요!
                </h3>
                
                <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '-8px' }}>
                  요리에 사용해서 냉장고에서 차감할 재료를 확인해 주세요.<br />
                  [확인 및 삭제] 버튼을 클릭하면 체크된 식재료가 삭제됩니다.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '16px', textAlign: 'left', border: '1px solid var(--gray-200)' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary-color)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📝 사용한 식재료 확인
                    </h4>
                    {selectedRecipe.matchedOwnedItems.length === 0 ? (
                      <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>매칭된 냉장고 식재료 없음</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedRecipe.matchedOwnedItems.map(item => {
                          const isChecked = usageChecklist[item.id];
                          return (
                            <div 
                              key={item.id}
                              onClick={() => handleToggleCheck(item.id)}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                background: isChecked ? '#fff5f5' : '#f8fafc',
                                border: isChecked ? '1px solid #feb2b2' : '1px solid var(--gray-200)',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 'bold', color: isChecked ? '#c53030' : 'var(--text-black)' }}>{item.name}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: isChecked ? '#e53e3e' : 'var(--gray-500)', fontWeight: 'bold' }}>
                                  {isChecked ? '사용함 (삭제)' : '남음 (보관)'}
                                </span>
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '4px',
                                  border: isChecked ? '1px solid #e53e3e' : '1px solid var(--gray-300)',
                                  backgroundColor: isChecked ? '#e53e3e' : '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {isChecked && <Check size={12} color="#FFFFFF" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    onClick={() => setShowChecklist(false)}
                    style={{
                      flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '12px',
                      fontSize: '13px', fontWeight: 'bold', color: 'var(--gray-600)', cursor: 'pointer'
                    }}
                  >
                    이전 단계로
                  </button>
                  <button 
                    onClick={handleCompleteCooking}
                    style={{
                      flex: 2, padding: '12px', background: 'var(--primary-color)', border: 'none', borderRadius: '12px',
                      fontSize: '13px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(55,146,113,0.2)'
                    }}
                  >
                    확인 및 삭제
                  </button>
                </div>
              </div>
            ) 
            // C. Else show Cooking Guide Steps
            : (
              <>
                {/* 1) STEP 0: BEFORE COOKING - SHOW INGREDIENTS LIST */}
                {activeStep === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Visual Banner */}
                    <div style={{
                      height: '120px',
                      borderRadius: '16px',
                      background: selectedRecipe.imageBg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      gap: '4px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                    }}>
                      <span style={{ fontSize: '48px' }}>{selectedRecipe.emoji}</span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-black)', margin: '0 0 4px 0' }}>
                        🍳 전체 필요 재료 준비하기
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>
                        요리를 시작하기 전에 아래의 전체 필요한 재료들을 싱크대에 준비해 주세요!
                      </p>
                    </div>

                    {/* Ingredients detail block */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--gray-600)' }}>
                        필요한 전체 재료 & 분량
                      </label>
                      <div style={{ 
                        background: '#f8fafc', 
                        padding: '14px 16px', 
                        borderRadius: '14px', 
                        fontSize: '13.5px', 
                        color: 'var(--gray-700)', 
                        lineHeight: '1.6',
                        border: '1.5px solid var(--gray-200)',
                        whiteSpace: 'pre-line'
                      }}>
                        {selectedRecipe.ingredients}
                      </div>
                    </div>

                    {/* Matching inventory highlight inside Step 0 */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--gray-600)', marginBottom: '8px' }}>
                        우리집 냉장고 보유 상태
                      </label>
                      {selectedRecipe.matchedOwnedItems.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--gray-400)', background: '#f3f4f6', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                          매칭되는 냉장고 식재료가 없습니다.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '12px' }}>
                          {selectedRecipe.matchedOwnedItems.map(item => (
                            <span key={item.id} style={{ fontSize: '11px', background: '#ffffff', color: '#166534', border: '1px solid #86efac', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              ✅ {item.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>


                    {/* Missing inventory highlight inside Step 0 */}
                    {(() => {
                      const missingItems = (selectedRecipe.parsedIngredients || []).filter(p => 
                        !selectedRecipe.matchedOwnedItems.some(item => 
                          item.name.toLowerCase().includes(p.cleanName.toLowerCase()) || 
                          p.cleanName.toLowerCase().includes(item.name.toLowerCase())
                        )
                      );

                      if (missingItems.length > 0) {
                        const selectedCount = Object.keys(selectedForPurchase).filter(k => selectedForPurchase[k]).length;
                        return (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e53e3e', marginBottom: '4px' }}>
                              부족한 식재료 (클릭 시 선택 / 주황색 네모)
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: '#fff5f5', border: '1px solid #feb2b2', padding: '12px', borderRadius: '12px' }}>
                              {missingItems.map((p, idx) => {
                                const isSelected = !!selectedForPurchase[p.fullName];
                                return (
                                  <div 
                                    key={idx} 
                                    onClick={() => handleTogglePurchaseSelect(p.fullName)}
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '6px', 
                                      background: isSelected ? '#fffaf0' : '#ffffff', 
                                      border: isSelected ? '1.8px solid #f97316' : '1px solid #fc8181', 
                                      padding: '5px 10px', 
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      userSelect: 'none',
                                      transition: 'all 0.15s',
                                      boxShadow: isSelected ? '0 2px 4px rgba(249,115,22,0.1)' : 'none'
                                    }}
                                  >
                                    <span style={{ 
                                      fontSize: '11px', 
                                      color: isSelected ? '#ea580c' : '#c53030', 
                                      fontWeight: 'bold' 
                                    }}>
                                      {p.fullName}
                                    </span>
                                    {isSelected && <span style={{ fontSize: '10px', color: '#ea580c' }}>✓</span>}
                                  </div>
                                );
                              })}
                            </div>
                            
                            <button
                              onClick={() => handleBatchAddToShopping(missingItems)}
                              className="btn-primary"
                              style={{
                                width: '100%',
                                background: selectedCount > 0 ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : '#cbd5e1',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '10px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: selectedCount > 0 ? '0 4px 6px rgba(249,115,22,0.15)' : 'none'
                              }}
                              disabled={selectedCount === 0}
                            >
                              <ShoppingCart size={15} /> 선택한 재료 장바구니에 담기 ({selectedCount}개 선택됨)
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Navigation buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button 
                        className="btn-primary" 
                        style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={() => setActiveStep(1)}
                      >
                        조리 시작하기 (Step 1) <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ) 
                
                // 2) STEP 1 ~ N: DETAILED CAROUSEL STEP WITH VISUAL ILLUSTRATION
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Active Step illustration card (Top Half) */}
                    {(() => {
                      const currentStepIdx = activeStep - 1;
                      const stepInfo = selectedRecipe.detailedSteps[currentStepIdx];
                      
                      return (
                        <>
                          <div style={{
                            position: 'relative',
                            height: '240px',
                            borderRadius: '16px',
                            background: stepInfo.actionBg || 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                            overflow: 'hidden'
                          }}>
                            {/* Step Badge */}
                            <div style={{
                              position: 'absolute',
                              top: '12px',
                              left: '12px',
                              background: 'rgba(0,0,0,0.25)',
                              backdropFilter: 'blur(4px)',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}>
                              단계 {activeStep} / {selectedRecipe.detailedSteps.length}
                            </div>

                            {/* Centered Large Action Graphic Icon / Image */}
                            {stepInfo.actionImage ? (
                              <img src={stepInfo.actionImage} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="조리 과정" />
                            ) : (
                              <div style={{ fontSize: '64px', animation: 'pulse 2s infinite' }}>
                                {stepInfo.actionIcon}
                              </div>
                            )}

                            {/* Action badge overlay */}
                            <div style={{
                              position: 'absolute',
                              bottom: '12px',
                              background: 'rgba(255, 255, 255, 0.85)',
                              backdropFilter: 'blur(4px)',
                              color: 'var(--text-black)',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }}>
                              조리 행동 : {stepInfo.actionName || `단계 ${activeStep}`}
                            </div>
                          </div>

                          {/* Action text explanation (Bottom Half) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <BookOpen size={14} /> 아주 친절한 조리 안내
                            </label>
                            
                            <div style={{ 
                              background: '#f9fafb', 
                              border: '1px solid var(--gray-200)',
                              padding: '16px', 
                              borderRadius: '16px', 
                              fontSize: '14.5px', 
                              color: 'var(--text-black)', 
                              lineHeight: '1.6', 
                              fontWeight: '500',
                              minHeight: '130px'
                            }}>
                              {stepInfo.stepText}
                            </div>
                          </div>

                          {/* Stepper Carousel Navigation buttons */}
                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            {/* Prev button */}
                            <button 
                              onClick={() => setActiveStep(prev => prev - 1)}
                              style={{
                                flex: 1,
                                padding: '12px 14px',
                                background: '#f1f5f9',
                                color: 'var(--gray-600)',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <ArrowLeft size={16} /> 이전
                            </button>

                            {/* Next or Finish button */}
                            {activeStep < selectedRecipe.detailedSteps.length ? (
                              <button 
                                onClick={() => setActiveStep(prev => prev + 1)}
                                style={{
                                  flex: 2,
                                  padding: '12px 14px',
                                  background: 'var(--primary-color)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '12px',
                                  fontSize: '13px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 6px rgba(55,146,113,0.15)'
                                }}
                              >
                                다음 단계 <ArrowRight size={16} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => setShowChecklist(true)}
                                style={{
                                  flex: 2,
                                  padding: '12px 14px',
                                  background: 'linear-gradient(135deg, #379271 0%, #2f7a5f 100%)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '12px',
                                  fontSize: '13px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(55,146,113,0.3)'
                                }}
                              >
                                <Check size={16} /> 요리 다 만들었어요!
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Cooking;
